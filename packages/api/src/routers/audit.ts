import { db } from "@BLMS/db";
import { auditLogs } from "@BLMS/db/schema/audit";
import { user as userTable } from "@BLMS/db/schema/auth";
import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { adminProcedure } from "../procedures";

export const auditRouter = {
	// List audit logs with pagination and filtering
	list: adminProcedure
		.input(
			z.object({
				page: z.number().default(1),
				limit: z.number().default(20),
				search: z.string().optional(),
				action: z.string().optional(),
				entity: z.string().optional(),
			}),
		)
		.output(
			z.object({
				logs: z.array(
					z.object({
						id: z.string(),
						userId: z.string().nullable(),
						userName: z.string().nullable(),
						userEmail: z.string().nullable(),
						action: z.string(),
						entity: z.string(),
						entityId: z.string(),
						details: z.any().nullable(),
						createdAt: z.date(),
					}),
				),
				total: z.number(),
				page: z.number(),
				totalPages: z.number(),
			}),
		)
		.handler(async ({ input }) => {
			const { page, limit, action, entity } = input;
			const offset = (page - 1) * limit;

			// Build where conditions
			const conditions = [];
			if (action) {
				conditions.push(eq(auditLogs.action, action));
			}
			if (entity) {
				conditions.push(eq(auditLogs.entity, entity));
			}

			// Get logs with user info
			const logs = await db
				.select({
					id: auditLogs.id,
					userId: auditLogs.userId,
					userName: userTable.name,
					userEmail: userTable.email,
					action: auditLogs.action,
					entity: auditLogs.entity,
					entityId: auditLogs.entityId,
					details: auditLogs.details,
					createdAt: auditLogs.createdAt,
				})
				.from(auditLogs)
				.leftJoin(userTable, eq(auditLogs.userId, userTable.id))
				.orderBy(desc(auditLogs.createdAt))
				.limit(limit)
				.offset(offset);

			// Get total count
			const countResult = await db
				.select({ count: sql<number>`count(*)` })
				.from(auditLogs);
			const total = Number(countResult[0]?.count || 0);

			return {
				logs,
				total,
				page,
				totalPages: Math.ceil(total / limit),
			};
		}),

	// Get distinct actions for filter dropdown
	getActions: adminProcedure.output(z.array(z.string())).handler(async () => {
		const result = await db
			.selectDistinct({ action: auditLogs.action })
			.from(auditLogs);
		return result.map((r) => r.action);
	}),

	// Get distinct entities for filter dropdown
	getEntities: adminProcedure.output(z.array(z.string())).handler(async () => {
		const result = await db
			.selectDistinct({ entity: auditLogs.entity })
			.from(auditLogs);
		return result.map((r) => r.entity);
	}),
};
