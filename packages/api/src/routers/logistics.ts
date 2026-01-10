import { db } from "@BLMS/db";
import { approvals, requestItems, requests } from "@BLMS/db/schema/logistics";
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { logAudit } from "../lib/audit";
import {
	protectedProcedure,
	regionalDirectorProcedure,
	rlmProcedure,
	stationCommanderProcedure,
	supplyOfficerProcedure,
} from "../procedures";

export const logisticsRouter = {
	list: protectedProcedure
		.input(
			z.object({
				status: z
					.enum([
						"DRAFT",
						"SUBMITTED",
						"VALIDATED",
						"REJECTED",
						"REVIEWED",
						"APPROVED",
					])
					.optional(),
				stationId: z.string().optional(),
				limit: z.number().optional(),
				offset: z.number().optional(),
			}),
		)
		.output(
			z.array(
				z.object({
					id: z.string(),
					stationId: z.string(),
					status: z.enum([
						"DRAFT",
						"SUBMITTED",
						"VALIDATED",
						"REJECTED",
						"REVIEWED",
						"APPROVED",
					]),
					priority: z.enum(["LOW", "NORMAL", "HIGH", "CRITICAL"]),
					justification: z.string().nullable(),
					createdBy: z.string(),
					submittedAt: z.date().nullable(),
					validatedBy: z.string().nullable(),
					validatedAt: z.date().nullable(),
					reviewedBy: z.string().nullable(),
					reviewedAt: z.date().nullable(),
					approvedBy: z.string().nullable(),
					approvedAt: z.date().nullable(),
					createdAt: z.date(),
					updatedAt: z.date(),
				}),
			),
		)
		.handler(async ({ input, context }) => {
			const { user } = context.session;

			return await db.query.requests.findMany({
				limit: input.limit,
				offset: input.offset,
				where: (requests, { eq, and }) => {
					const conditions = [];
					if (input?.status) conditions.push(eq(requests.status, input.status));

					if (
						user.role === "supply-officer" ||
						user.role === "station-commander"
					) {
						conditions.push(eq(requests.stationId, user.stationId || ""));
					} else if (input?.stationId) {
						conditions.push(eq(requests.stationId, input.stationId));
					}

					return conditions.length > 0 ? and(...conditions) : undefined;
				},
				orderBy: (requests, { desc }) => [desc(requests.createdAt)],
			});
		}),

	get: protectedProcedure
		.input(z.object({ id: z.string() }))
		.output(
			z.object({
				id: z.string(),
				stationId: z.string(),
				status: z.enum([
					"DRAFT",
					"SUBMITTED",
					"VALIDATED",
					"REJECTED",
					"REVIEWED",
					"APPROVED",
				]),
				priority: z.enum(["LOW", "NORMAL", "HIGH", "CRITICAL"]),
				justification: z.string().nullable(),
				createdBy: z.string(),
				createdAt: z.date(),
				submittedAt: z.date().nullable(),
				items: z.array(
					z.object({
						id: z.string(),
						itemName: z.string(),
						quantity: z.number(),
						category: z.string(),
					}),
				),
				approvals: z.array(
					z.object({
						id: z.string(),
						role: z.string(),
						action: z.string(),
						remarks: z.string().nullable(),
						createdAt: z.date(),
						user: z.object({
							name: z.string(),
						}),
					}),
				),
			}),
		)
		.handler(async ({ input, context }) => {
			const { user } = context.session;

			const request = await db.query.requests.findFirst({
				where: eq(requests.id, input.id),
				with: {
					items: true,
					approvals: {
						with: {
							user: true,
						},
						orderBy: (approvals, { desc }) => [desc(approvals.createdAt)],
					},
				},
			});

			if (!request) {
				throw new ORPCError("NOT_FOUND", { message: "Request not found" });
			}

			// Security check: ensure user can view this request
			const isRegional = [
				"regional-logistics-manager",
				"regional-director",
				"regional-admin",
			].includes(user.role || "");

			if (!isRegional && request.stationId !== user.stationId) {
				throw new ORPCError("FORBIDDEN", {
					message: "You can only view requests from your own station.",
				});
			}

			return request;
		}),

	getStats: protectedProcedure
		.output(
			z.object({
				draft: z.number(),
				pending: z.number(),
				submitted: z.number(),
				validated: z.number(),
				reviewed: z.number(),
				approved: z.number(),
				rejected: z.number(),
			}),
		)
		.handler(async ({ context }) => {
			const { user } = context.session;
			const stationId = user.stationId;

			// Fetch all requests for this station to aggregate in memory (for simplicity with partial index support)
			// OR use proper groupBy query. Given the schema limitation on 'db.query', finding many and reducing is safe for now unless huge scale.
			// Let's stick to findMany for consistency but select only status.

			const requestsData = await db.query.requests.findMany({
				columns: { status: true },
				where: (requests, { eq }) => {
					if (
						user.role === "supply-officer" ||
						user.role === "station-commander"
					) {
						return stationId ? eq(requests.stationId, stationId) : undefined;
					}
					// Regional view could see all, but let's default to empty or all if needed.
					// For dashboard stats, usually its for the user's scope.
					return undefined;
				},
			});

			const stats = {
				draft: 0,
				pending: 0,
				submitted: 0,
				validated: 0,
				reviewed: 0,
				approved: 0,
				rejected: 0,
			};

			for (const r of requestsData) {
				if (r.status === "DRAFT") stats.draft++;
				else if (r.status === "APPROVED") stats.approved++;
				else if (r.status === "REJECTED") stats.rejected++;
				else if (r.status === "SUBMITTED") {
					stats.submitted++;
					stats.pending++;
				} else if (r.status === "VALIDATED") {
					stats.validated++;
					stats.pending++;
				} else if (r.status === "REVIEWED") {
					stats.reviewed++;
					stats.pending++;
				}
			}

			return stats;
		}),

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
		.output(
			z.object({
				success: z.boolean(),
				request: z.object({
					id: z.string(),
					stationId: z.string(),
					status: z.enum([
						"DRAFT",
						"SUBMITTED",
						"VALIDATED",
						"REJECTED",
						"REVIEWED",
						"APPROVED",
					]),
					priority: z.enum(["LOW", "NORMAL", "HIGH", "CRITICAL"]),
					justification: z.string().nullable(),
					createdBy: z.string(),
					submittedAt: z.date().nullable(),
					validatedBy: z.string().nullable(),
					validatedAt: z.date().nullable(),
					reviewedBy: z.string().nullable(),
					reviewedAt: z.date().nullable(),
					approvedBy: z.string().nullable(),
					approvedAt: z.date().nullable(),
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

			return await db.transaction(async (tx) => {
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

				// Log audit event
				await logAudit({
					userId: user.id,
					action: "REQUEST_CREATE",
					entity: "request",
					entityId: newRequest.id,
					details: {
						priority: input.priority,
						status: input.status,
						itemCount: input.items.length,
					},
				});

				return { success: true, request: newRequest };
			});
		}),

	submit: supplyOfficerProcedure
		.input(z.object({ requestId: z.string() }))
		.output(
			z.object({
				success: z.boolean(),
				status: z.string(),
			}),
		)
		.handler(async ({ input, context }) => {
			const { user } = context.session;

			const request = await db.query.requests.findFirst({
				where: eq(requests.id, input.requestId),
			});

			if (!request) {
				throw new ORPCError("NOT_FOUND", { message: "Request not found" });
			}

			if (request.stationId !== user.stationId) {
				throw new ORPCError("FORBIDDEN", {
					message: "You can only submit requests for your own station.",
				});
			}

			if (request.status !== "DRAFT") {
				throw new ORPCError("PRECONDITION_FAILED", {
					message: "Only DRAFT requests can be submitted.",
				});
			}

			return await db.transaction(async (tx) => {
				await tx
					.update(requests)
					.set({
						status: "SUBMITTED",
						submittedAt: new Date(),
						updatedAt: new Date(),
					})
					.where(eq(requests.id, input.requestId));

				// Log audit event
				await logAudit({
					userId: user.id,
					action: "REQUEST_SUBMIT",
					entity: "request",
					entityId: input.requestId,
					details: { previousStatus: "DRAFT", newStatus: "SUBMITTED" },
				});

				return { success: true, status: "SUBMITTED" };
			});
		}),

	delete: supplyOfficerProcedure
		.input(z.object({ requestId: z.string() }))
		.output(
			z.object({
				success: z.boolean(),
			}),
		)
		.handler(async ({ input, context }) => {
			const { user } = context.session;

			const request = await db.query.requests.findFirst({
				where: eq(requests.id, input.requestId),
			});

			if (!request) {
				throw new ORPCError("NOT_FOUND", { message: "Request not found" });
			}

			if (request.stationId !== user.stationId) {
				throw new ORPCError("FORBIDDEN", {
					message: "You can only delete requests from your own station.",
				});
			}

			if (!["DRAFT", "SUBMITTED"].includes(request.status)) {
				throw new ORPCError("PRECONDITION_FAILED", {
					message: "Only DRAFT or SUBMITTED requests can be deleted/cancelled.",
				});
			}

			await db.transaction(async (tx) => {
				await tx.delete(requests).where(eq(requests.id, input.requestId));

				// Log audit event
				await logAudit({
					userId: user.id,
					action: "REQUEST_DELETE",
					entity: "request",
					entityId: input.requestId,
					details: { status: request.status },
				});
			});

			return { success: true };
		}),

	update: supplyOfficerProcedure
		.input(
			z.object({
				requestId: z.string(),
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
				status: z.enum(["DRAFT", "SUBMITTED"]).default("DRAFT"),
			}),
		)
		.output(
			z.object({
				success: z.boolean(),
				request: z.object({
					id: z.string(),
				}),
			}),
		)
		.handler(async ({ input, context }) => {
			const { user } = context.session;

			const request = await db.query.requests.findFirst({
				where: eq(requests.id, input.requestId),
			});

			if (!request) {
				throw new ORPCError("NOT_FOUND", { message: "Request not found" });
			}

			if (request.stationId !== user.stationId) {
				throw new ORPCError("FORBIDDEN", {
					message: "You can only update requests from your own station.",
				});
			}

			if (request.status !== "DRAFT") {
				throw new ORPCError("PRECONDITION_FAILED", {
					message: "Only DRAFT requests can be edited.",
				});
			}

			return await db.transaction(async (tx) => {
				await tx
					.update(requests)
					.set({
						priority: input.priority,
						justification: input.justification,
						status: input.status,
						updatedAt: new Date(),
						submittedAt: input.status === "SUBMITTED" ? new Date() : null,
					})
					.where(eq(requests.id, input.requestId));

				// Replace items
				await tx
					.delete(requestItems)
					.where(eq(requestItems.requestId, input.requestId));

				if (input.items.length > 0) {
					await tx.insert(requestItems).values(
						input.items.map((item) => ({
							id: crypto.randomUUID(),
							requestId: input.requestId,
							itemName: item.itemName,
							quantity: item.quantity,
							category: item.category,
						})),
					);
				}

				// Log audit event
				await logAudit({
					userId: user.id,
					action: "REQUEST_UPDATE",
					entity: "request",
					entityId: input.requestId,
					details: { status: input.status, itemCount: input.items.length },
				});

				return { success: true, request: { id: input.requestId } };
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
		.output(
			z.object({
				success: z.boolean(),
				status: z.string(),
			}),
		)
		.handler(async ({ input, context }) => {
			const { user } = context.session;

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

				await tx.insert(approvals).values({
					id: crypto.randomUUID(),
					requestId: input.requestId,
					userId: user.id,
					role: user.role || "unknown",
					action: input.action,
					remarks: input.remarks,
				});

				// Log audit event
				await logAudit({
					userId: user.id,
					action:
						input.action === "VALIDATE" ? "REQUEST_VALIDATE" : "REQUEST_REJECT",
					entity: "request",
					entityId: input.requestId,
					details: { newStatus, remarks: input.remarks },
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
		.output(
			z.object({
				success: z.boolean(),
				status: z.string(),
			}),
		)
		.handler(async ({ input, context }) => {
			const { user } = context.session;

			const request = await db.query.requests.findFirst({
				where: eq(requests.id, input.requestId),
			});

			if (!request)
				throw new ORPCError("NOT_FOUND", { message: "Request not found" });

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

				// Log audit event
				await logAudit({
					userId: user.id,
					action: "REQUEST_CONSOLIDATE",
					entity: "request",
					entityId: input.requestId,
					details: { action: input.action, newStatus, remarks: input.remarks },
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
		.output(
			z.object({
				success: z.boolean(),
				status: z.string(),
			}),
		)
		.handler(async ({ input, context }) => {
			const { user } = context.session;

			const request = await db.query.requests.findFirst({
				where: eq(requests.id, input.requestId),
			});

			if (!request)
				throw new ORPCError("NOT_FOUND", { message: "Request not found" });

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

				// Log audit event
				await logAudit({
					userId: user.id,
					action:
						input.action === "APPROVE"
							? "REQUEST_APPROVE"
							: "REQUEST_FINAL_REJECT",
					entity: "request",
					entityId: input.requestId,
					details: { newStatus, remarks: input.remarks },
				});

				return { success: true, status: newStatus };
			});
		}),
};
