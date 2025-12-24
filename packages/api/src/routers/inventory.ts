import { db } from "@BLMS/db";
import { assets, assetTransfers, inventory } from "@BLMS/db/schema/inventory";
import { ORPCError } from "@orpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import {
	protectedProcedure,
	stationCommanderProcedure,
	supplyOfficerProcedure,
} from "../procedures";

export const inventoryRouter = {
	// List all inventory and assets for a station
	list: protectedProcedure
		.input(
			z.object({
				stationId: z.string().optional(),
			}),
		)
		.handler(async ({ input, context }) => {
			const { user } = context.session;
			const isRegional =
				user.role &&
				[
					"regional-logistics-manager",
					"regional-director",
					"regional-admin",
				].includes(user.role);

			// For station users, ALWAYS force their own station ID
			// For regional users, use input station ID, or error if missing
			let targetStationId = input.stationId;

			if (!isRegional) {
				targetStationId = user.stationId || undefined;
			}

			if (!targetStationId) {
				throw new ORPCError("BAD_REQUEST", {
					message: "Station ID is required.",
				});
			}

			// Extra check: if station user tries to access another station (should be caught by logic above, but explicitly)
			if (!isRegional && targetStationId !== user.stationId) {
				// This condition is actually impossible given the logic above, but good for sanity
				throw new ORPCError("FORBIDDEN", {
					message: "You can only view your own station's inventory.",
				});
			}

			const inventoryItems = await db.query.inventory.findMany({
				where: eq(inventory.stationId, targetStationId),
				with: {
					station: true,
				},
			});

			const stationAssets = await db.query.assets.findMany({
				where: eq(assets.stationId, targetStationId),
				with: {
					station: true,
				},
			});

			return {
				inventory: inventoryItems,
				assets: stationAssets,
			};
		}),

	// List ALL inventory and assets (Regional Only)
	listAll: protectedProcedure.handler(async ({ context }) => {
		const { user } = context.session;
		const isRegional =
			user.role &&
			[
				"regional-logistics-manager",
				"regional-director",
				"regional-admin",
			].includes(user.role);

		if (!isRegional) {
			throw new ORPCError("FORBIDDEN", {
				message: "Only regional roles can view all inventory.",
			});
		}

		const inventoryItems = await db.query.inventory.findMany({
			with: {
				station: true,
			},
		});

		const allAssets = await db.query.assets.findMany({
			with: {
				station: true,
			},
		});

		return {
			inventory: inventoryItems,
			assets: allAssets,
		};
	}),

	// Add or update inventory item (upsert by station + itemName)
	upsertInventory: supplyOfficerProcedure
		.input(
			z.object({
				itemName: z.string(),
				category: z.string(),
				quantity: z.number().int(),
				unit: z.string().optional(),
			}),
		)
		.handler(async ({ input, context }) => {
			const { user } = context.session;

			if (!user.stationId) {
				throw new ORPCError("BAD_REQUEST", {
					message: "User is not assigned to a station.",
				});
			}

			const stationId = user.stationId;

			// Check if item exists
			const existing = await db.query.inventory.findFirst({
				where: and(
					eq(inventory.stationId, stationId),
					eq(inventory.itemName, input.itemName),
				),
			});

			if (existing) {
				// Update quantity
				await db
					.update(inventory)
					.set({
						quantity: input.quantity,
						category: input.category,
						unit: input.unit,
					})
					.where(eq(inventory.id, existing.id));

				return { success: true, action: "updated", id: existing.id };
			}

			// Create new item
			const insertedItems = await db
				.insert(inventory)
				.values({
					id: crypto.randomUUID(),
					stationId: stationId,
					itemName: input.itemName,
					category: input.category,
					quantity: input.quantity,
					unit: input.unit || "pcs",
				})
				.returning();

			return {
				success: true,
				action: "created",
				id: insertedItems[0]?.id,
			};
		}),

	// Create a new asset
	createAsset: supplyOfficerProcedure
		.input(
			z.object({
				name: z.string(),
				serialNumber: z.string().optional(),
				category: z.string(),
				acquiredAt: z.string().datetime().optional(),
			}),
		)
		.handler(async ({ input, context }) => {
			const { user } = context.session;

			if (!user.stationId) {
				throw new ORPCError("BAD_REQUEST", {
					message: "User is not assigned to a station.",
				});
			}

			const stationId = user.stationId;

			// Check for duplicate serial number (if provided)
			if (input.serialNumber) {
				const existingAsset = await db.query.assets.findFirst({
					where: eq(assets.serialNumber, input.serialNumber),
				});

				if (existingAsset) {
					throw new ORPCError("CONFLICT", {
						message: `Asset with serial number ${input.serialNumber} already exists.`,
					});
				}
			}

			const insertedAssets = await db
				.insert(assets)
				.values({
					id: crypto.randomUUID(),
					stationId: stationId,
					name: input.name,
					serialNumber: input.serialNumber,
					category: input.category,
					acquiredAt: input.acquiredAt ? new Date(input.acquiredAt) : null,
				})
				.returning();

			return { success: true, asset: insertedAssets[0] };
		}),

	// Update asset status
	updateAssetStatus: stationCommanderProcedure
		.input(
			z.object({
				assetId: z.string(),
				status: z.enum(["GOOD", "REPAIR", "DISPOSED", "LOST"]),
			}),
		)
		.handler(async ({ input, context }) => {
			const { user } = context.session;

			const asset = await db.query.assets.findFirst({
				where: eq(assets.id, input.assetId),
			});

			if (!asset) {
				throw new ORPCError("NOT_FOUND", { message: "Asset not found" });
			}

			if (asset.stationId !== user.stationId) {
				throw new ORPCError("FORBIDDEN", {
					message: "You can only update assets from your own station.",
				});
			}

			await db
				.update(assets)
				.set({ status: input.status })
				.where(eq(assets.id, input.assetId));

			return { success: true, status: input.status };
		}),

	// Initiate asset transfer
	transferAsset: stationCommanderProcedure
		.input(
			z.object({
				assetId: z.string(),
				toStationId: z.string(),
				remarks: z.string().optional(),
			}),
		)
		.handler(async ({ input, context }) => {
			const { user } = context.session;

			if (!user.stationId) {
				throw new ORPCError("BAD_REQUEST", {
					message: "User is not assigned to a station.",
				});
			}

			const stationId = user.stationId;

			const asset = await db.query.assets.findFirst({
				where: eq(assets.id, input.assetId),
			});

			if (!asset) {
				throw new ORPCError("NOT_FOUND", { message: "Asset not found" });
			}

			if (asset.stationId !== stationId) {
				throw new ORPCError("FORBIDDEN", {
					message: "You can only transfer assets from your own station.",
				});
			}

			if (asset.stationId === input.toStationId) {
				throw new ORPCError("BAD_REQUEST", {
					message: "Cannot transfer asset to the same station.",
				});
			}

			// Check for pending transfer
			const pendingTransfer = await db.query.assetTransfers.findFirst({
				where: and(
					eq(assetTransfers.assetId, input.assetId),
					eq(assetTransfers.status, "PENDING"),
				),
			});

			if (pendingTransfer) {
				throw new ORPCError("CONFLICT", {
					message: "Asset already has a pending transfer.",
				});
			}

			const insertedTransfers = await db
				.insert(assetTransfers)
				.values({
					id: crypto.randomUUID(),
					assetId: input.assetId,
					fromStationId: stationId,
					toStationId: input.toStationId,
					requestedBy: user.id,
					remarks: input.remarks,
				})
				.returning();

			return { success: true, transfer: insertedTransfers[0] };
		}),

	// Complete/Accept asset transfer (receiving station commander)
	completeTransfer: stationCommanderProcedure
		.input(
			z.object({
				transferId: z.string(),
				action: z.enum(["COMPLETE", "CANCEL"]),
			}),
		)
		.handler(async ({ input, context }) => {
			const { user } = context.session;

			const transfer = await db.query.assetTransfers.findFirst({
				where: eq(assetTransfers.id, input.transferId),
			});

			if (!transfer) {
				throw new ORPCError("NOT_FOUND", { message: "Transfer not found" });
			}

			if (transfer.status !== "PENDING") {
				throw new ORPCError("PRECONDITION_FAILED", {
					message: "Transfer is not in PENDING status.",
				});
			}

			// Only the receiving station can complete, either station can cancel
			if (
				input.action === "COMPLETE" &&
				transfer.toStationId !== user.stationId
			) {
				throw new ORPCError("FORBIDDEN", {
					message: "Only the receiving station can complete this transfer.",
				});
			}

			if (
				input.action === "CANCEL" &&
				transfer.fromStationId !== user.stationId &&
				transfer.toStationId !== user.stationId
			) {
				throw new ORPCError("FORBIDDEN", {
					message: "Only involved stations can cancel this transfer.",
				});
			}

			return await db.transaction(async (tx) => {
				const newStatus =
					input.action === "COMPLETE" ? "COMPLETED" : "CANCELLED";

				await tx
					.update(assetTransfers)
					.set({
						status: newStatus,
						approvedBy: user.id,
					})
					.where(eq(assetTransfers.id, input.transferId));

				// If completed, update asset's station
				if (input.action === "COMPLETE") {
					await tx
						.update(assets)
						.set({ stationId: transfer.toStationId })
						.where(eq(assets.id, transfer.assetId));
				}

				return { success: true, status: newStatus };
			});
		}),
};
