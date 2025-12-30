import { db } from "@BLMS/db";
import { assets, assetTransfers, inventory } from "@BLMS/db/schema/inventory";
import { ORPCError } from "@orpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { logAudit } from "../lib/audit";
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
		.output(
			z.object({
				inventory: z.array(
					z.object({
						id: z.string(),
						stationId: z.string(),
						itemName: z.string(),
						category: z.string(),
						quantity: z.number(),
						unit: z.string().nullable(),
						createdAt: z.date(),
						updatedAt: z.date(),
						station: z.object({
							id: z.string(),
							name: z.string(),
							cityId: z.string(),
							provinceId: z.string(),
							createdAt: z.date(),
							updatedAt: z.date(),
						}),
					}),
				),
				assets: z.array(
					z.object({
						id: z.string(),
						stationId: z.string(),
						name: z.string(),
						serialNumber: z.string().nullable(),
						category: z.string(),
						status: z.enum(["GOOD", "REPAIR", "DISPOSED", "LOST"]),
						acquiredAt: z.date().nullable(),
						createdAt: z.date(),
						updatedAt: z.date(),
						station: z.object({
							id: z.string(),
							name: z.string(),
							cityId: z.string(),
							provinceId: z.string(),
							createdAt: z.date(),
							updatedAt: z.date(),
						}),
					}),
				),
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
	listAll: protectedProcedure
		.output(
			z.object({
				inventory: z.array(
					z.object({
						id: z.string(),
						stationId: z.string(),
						itemName: z.string(),
						category: z.string(),
						quantity: z.number(),
						unit: z.string().nullable(),
						createdAt: z.date(),
						updatedAt: z.date(),
						station: z.object({
							id: z.string(),
							name: z.string(),
							cityId: z.string(),
							provinceId: z.string(),
							createdAt: z.date(),
							updatedAt: z.date(),
						}),
					}),
				),
				assets: z.array(
					z.object({
						id: z.string(),
						stationId: z.string(),
						name: z.string(),
						serialNumber: z.string().nullable(),
						category: z.string(),
						status: z.enum(["GOOD", "REPAIR", "DISPOSED", "LOST"]),
						acquiredAt: z.date().nullable(),
						createdAt: z.date(),
						updatedAt: z.date(),
						station: z.object({
							id: z.string(),
							name: z.string(),
							cityId: z.string(),
							provinceId: z.string(),
							createdAt: z.date(),
							updatedAt: z.date(),
						}),
					}),
				),
			}),
		)
		.handler(async ({ context }) => {
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

	// Create new inventory item (Supply Officer only)
	createItem: supplyOfficerProcedure
		.input(
			z.object({
				itemName: z.string(),
				category: z.string(),
				quantity: z.number().int(),
				unit: z.string().optional(),
			}),
		)
		.output(
			z.object({
				success: z.boolean(),
				id: z.string(),
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
				throw new ORPCError("CONFLICT", {
					message: "Item with this name already exists in your station.",
				});
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

			const newItem = insertedItems[0];
			if (!newItem) return { success: false, id: "" };

			// Log creation
			await logAudit({
				userId: user.id,
				action: "INVENTORY_CREATE",
				entity: "inventory",
				entityId: newItem.id,
				details: {
					itemName: input.itemName,
					initialQuantity: input.quantity,
				},
			});

			return {
				success: true,
				id: newItem.id,
			};
		}),

	// Adjust Stock (Stock In / Stock Out)
	adjustStock: supplyOfficerProcedure
		.input(
			z.object({
				itemId: z.string(),
				adjustment: z.number().int(), // Positive or negative
				reason: z.string(),
				reference: z.string().optional(), // e.g. "DR#123"
			}),
		)
		.output(
			z.object({
				success: z.boolean(),
				newQuantity: z.number(),
			}),
		)
		.handler(async ({ input, context }) => {
			const { user } = context.session;

			if (!user.stationId) {
				throw new ORPCError("BAD_REQUEST", { message: "No station assigned" });
			}

			const item = await db.query.inventory.findFirst({
				where: eq(inventory.id, input.itemId),
			});

			if (!item) {
				throw new ORPCError("NOT_FOUND", { message: "Item not found" });
			}

			if (item.stationId !== user.stationId) {
				throw new ORPCError("FORBIDDEN", {
					message: "You can only adjust your own station's inventory",
				});
			}

			const newQuantity = item.quantity + input.adjustment;

			if (newQuantity < 0) {
				throw new ORPCError("BAD_REQUEST", {
					message: "Insufficient stock for this adjustment.",
				});
			}

			// Update quantity
			await db
				.update(inventory)
				.set({ quantity: newQuantity, updatedAt: new Date() })
				.where(eq(inventory.id, input.itemId));

			// Log audit
			await logAudit({
				userId: user.id,
				action: input.adjustment > 0 ? "STOCK_IN" : "STOCK_OUT",
				entity: "inventory",
				entityId: item.id,
				details: {
					previous: item.quantity,
					adjustment: input.adjustment,
					new: newQuantity,
					reason: input.reason,
					reference: input.reference,
				},
			});

			return { success: true, newQuantity };
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
		.output(
			z.object({
				success: z.boolean(),
				asset: z.object({
					id: z.string(),
					stationId: z.string(),
					name: z.string(),
					serialNumber: z.string().nullable(),
					category: z.string(),
					status: z.enum(["GOOD", "REPAIR", "DISPOSED", "LOST"]),
					acquiredAt: z.date().nullable(),
					createdAt: z.date(),
					updatedAt: z.date(),
				}),
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

			const newAsset = insertedAssets[0];
			if (!newAsset) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to create asset",
				});
			}

			// Log creation
			await logAudit({
				userId: user.id,
				action: "ASSET_CREATE",
				entity: "asset",
				entityId: newAsset.id,
				details: {
					name: input.name,
					serialNumber: input.serialNumber,
					category: input.category,
				},
			});

			return { success: true, asset: newAsset };
		}),

	// Update asset status
	updateAssetStatus: supplyOfficerProcedure
		.input(
			z.object({
				assetId: z.string(),
				status: z.enum(["GOOD", "REPAIR", "DISPOSED", "LOST"]),
			}),
		)
		.output(
			z.object({
				success: z.boolean(),
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
		.output(
			z.object({
				success: z.boolean(),
				transfer: z.object({
					id: z.string(),
					assetId: z.string(),
					fromStationId: z.string(),
					toStationId: z.string(),
					status: z.enum(["PENDING", "APPROVED", "COMPLETED", "CANCELLED"]),
					requestedBy: z.string(),
					approvedBy: z.string().nullable(),
					remarks: z.string().nullable(),
					createdAt: z.date(),
					updatedAt: z.date(),
				}),
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

			const newTransfer = insertedTransfers[0];
			if (!newTransfer) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: "Failed to create transfer",
				});
			}

			return { success: true, transfer: newTransfer };
		}),

	// Complete/Accept asset transfer (receiving station commander)
	completeTransfer: stationCommanderProcedure
		.input(
			z.object({
				transferId: z.string(),
				action: z.enum(["COMPLETE", "CANCEL"]),
			}),
		)
		.output(
			z.object({
				success: z.boolean(),
				status: z.string(),
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
