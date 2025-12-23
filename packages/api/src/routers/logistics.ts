import { db } from "@BLMS/db";
import { approvals, requestItems, requests } from "@BLMS/db/schema/logistics";
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import {
	regionalDirectorProcedure,
	rlmProcedure,
	stationCommanderProcedure,
	supplyOfficerProcedure,
} from "../index";

export const logisticsRouter = {
	create: supplyOfficerProcedure
		.input(
			z.object({
				priority: z.enum(["LOW", "NORMAL", "HIGH", "CRITICAL"]),
				justification: z.string().optional(),
				items: z
					.array(
						z.object({
							itemName: z.string(),
							quantity: z.number().int().positive(),
							category: z.string(),
						}),
					)
					.min(1),
				status: z.enum(["DRAFT", "SUBMITTED"]).default("SUBMITTED"),
			}),
		)
		.handler(async ({ input, context }) => {
			const { user } = context.session;

			if (!user.stationId) {
				throw new ORPCError("BAD_REQUEST", {
					message: "User is not assigned to a station.",
				});
			}

			return await db.transaction(async (tx) => {
				// 1. Create Request
				const insertedRequests = await tx
					.insert(requests)
					.values({
						id: crypto.randomUUID(),
						stationId: user.stationId as string,
						priority: input.priority,
						justification: input.justification,
						status: input.status,
						createdBy: user.id,
						submittedAt: input.status === "SUBMITTED" ? new Date() : null,
					})
					.returning();

				const newRequest = insertedRequests[0];
				if (!newRequest) {
					throw new ORPCError("INTERNAL_SERVER_ERROR", {
						message: "Failed to create request",
					});
				}

				// 2. Create Items
				if (input.items.length > 0) {
					await tx.insert(requestItems).values(
						input.items.map((item) => ({
							id: crypto.randomUUID(),
							requestId: newRequest.id,
							itemName: item.itemName,
							quantity: item.quantity,
							category: item.category,
						})),
					);
				}

				return { success: true, request: newRequest };
			});
		}),

	validate: stationCommanderProcedure
		.input(
			z.object({
				requestId: z.string(),
				action: z.enum(["VALIDATE", "REJECT"]),
				remarks: z.string().optional(),
			}),
		)
		.handler(async ({ input, context }) => {
			const { user } = context.session;

			// 1. Verify Request existence and ownership (Station Commander can only validate their station's requests)
			const request = await db.query.requests.findFirst({
				where: eq(requests.id, input.requestId),
			});

			if (!request) {
				throw new ORPCError("NOT_FOUND", { message: "Request not found" });
			}

			if (request.stationId !== user.stationId) {
				throw new ORPCError("FORBIDDEN", {
					message: "You can only validate requests from your own station.",
				});
			}

			// 2. Update Status
			const newStatus = input.action === "VALIDATE" ? "VALIDATED" : "REJECTED";

			return await db.transaction(async (tx) => {
				await tx
					.update(requests)
					.set({
						status: newStatus,
						validatedBy: user.id,
						validatedAt: new Date(),
					})
					.where(eq(requests.id, input.requestId));

				// 3. Log Approval/Action
				await tx.insert(approvals).values({
					id: crypto.randomUUID(),
					requestId: input.requestId,
					userId: user.id,
					role: user.role || "unknown", // Handle possible null role
					action: input.action,
					remarks: input.remarks,
				});

				return { success: true, status: newStatus };
			});
		}),

	consolidate: rlmProcedure
		.input(
			z.object({
				requestId: z.string(),
				action: z.enum(["REVIEW", "REJECT"]),
				remarks: z.string().optional(),
			}),
		)
		.handler(async ({ input, context }) => {
			const { user } = context.session;

			const request = await db.query.requests.findFirst({
				where: eq(requests.id, input.requestId),
			});

			if (!request)
				throw new ORPCError("NOT_FOUND", { message: "Request not found" });

			// RLM can only act on VALIDATED requests
			if (request.status !== "VALIDATED") {
				throw new ORPCError("PRECONDITION_FAILED", {
					message: "Request must be VALIDATED by Station Commander first.",
				});
			}

			const newStatus = input.action === "REVIEW" ? "REVIEWED" : "REJECTED";

			return await db.transaction(async (tx) => {
				await tx
					.update(requests)
					.set({
						status: newStatus,
						reviewedBy: user.id,
						reviewedAt: new Date(),
					})
					.where(eq(requests.id, input.requestId));

				await tx.insert(approvals).values({
					id: crypto.randomUUID(),
					requestId: input.requestId,
					userId: user.id,
					role: user.role || "unknown",
					action: input.action,
					remarks: input.remarks,
				});

				return { success: true, status: newStatus };
			});
		}),

	finalApprove: regionalDirectorProcedure
		.input(
			z.object({
				requestId: z.string(),
				action: z.enum(["APPROVE", "REJECT"]),
				remarks: z.string().optional(),
			}),
		)
		.handler(async ({ input, context }) => {
			const { user } = context.session;

			const request = await db.query.requests.findFirst({
				where: eq(requests.id, input.requestId),
			});

			if (!request)
				throw new ORPCError("NOT_FOUND", { message: "Request not found" });

			// Director can only act on REVIEWED requests
			if (request.status !== "REVIEWED") {
				throw new ORPCError("PRECONDITION_FAILED", {
					message: "Request must be REVIEWED by RLM first.",
				});
			}

			const newStatus = input.action === "APPROVE" ? "APPROVED" : "REJECTED";

			return await db.transaction(async (tx) => {
				await tx
					.update(requests)
					.set({
						status: newStatus,
						approvedBy: user.id,
						approvedAt: new Date(),
					})
					.where(eq(requests.id, input.requestId));

				await tx.insert(approvals).values({
					id: crypto.randomUUID(),
					requestId: input.requestId,
					userId: user.id,
					role: user.role || "unknown",
					action: input.action,
					remarks: input.remarks,
				});

				return { success: true, status: newStatus };
			});
		}),
};
