import { programmaticAuth } from "@BLMS/auth";
import { db } from "@BLMS/db";
import { user as userTable } from "@BLMS/db/schema/auth";
import { provinces, stations } from "@BLMS/db/schema/geo";
import { assets, inventory } from "@BLMS/db/schema/inventory";
import { requests } from "@BLMS/db/schema/logistics";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { logAudit } from "../lib/audit";
import { adminProcedure } from "../procedures";

export const adminRouter = {
	// Get system-wide statistics for admin dashboard
	stats: adminProcedure
		.output(
			z.object({
				totalUsers: z.number(),
				totalStations: z.number(),
				totalRequests: z.number(),
				pendingRequests: z.number(),
				totalProvinces: z.number(),
				totalInventoryItems: z.number(),
				totalAssets: z.number(),
			}),
		)
		.handler(async () => {
			const result = await db.execute(sql`
            SELECT
                (SELECT COUNT(*) FROM ${userTable}) as "totalUsers",
                (SELECT COUNT(*) FROM ${stations}) as "totalStations",
                (SELECT COUNT(*) FROM ${requests}) as "totalRequests",
                (SELECT COUNT(*) FROM ${requests} WHERE ${requests.status} = 'SUBMITTED') as "pendingRequests",
                (SELECT COUNT(*) FROM ${provinces}) as "totalProvinces",
                (SELECT COUNT(*) FROM ${inventory}) as "totalInventoryItems",
                (SELECT COUNT(*) FROM ${assets}) as "totalAssets"
        `);

			// Drizzle execute returns an array of rows. With Postgres it's usually result[0]
			// But the type might vary depending on driver.
			// Safest is to cast or inspect.
			// For 'postgres' driver (node-postgres), result.rows[0] is the data if using raw client,
			// but drizzle .execute returns the raw result.
			// Let's use simpler drizzle API:
			// const [stats] = await db.select({ ... }).from(sql`...`)
			// Actually, db.execute is fine but we need to handle the return type.

			// Alternative: Use a dummy select with lateral joins or just access the first row.
			const row = result.rows[0];

			return {
				totalUsers: Number(row?.totalUsers || 0),
				totalStations: Number(row?.totalStations || 0),
				totalRequests: Number(row?.totalRequests || 0),
				pendingRequests: Number(row?.pendingRequests || 0),
				totalProvinces: Number(row?.totalProvinces || 0),
				totalInventoryItems: Number(row?.totalInventoryItems || 0),
				totalAssets: Number(row?.totalAssets || 0),
			};
		}),

	// List all users (for admin management)
	listUsers: adminProcedure
		.input(
			z.object({
				limit: z.number().optional(),
				offset: z.number().optional(),
				search: z.string().optional(),
			}),
		)
		.output(
			z.object({
				users: z.array(
					z.object({
						id: z.string(),
						name: z.string().nullable(),
						email: z.string(),
						role: z.string().nullable(),
						stationId: z.string().nullable(),
						provinceId: z.string().nullable(),
						createdAt: z.date(),
					}),
				),
				total: z.number(),
			}),
		)
		.handler(async ({ input }) => {
			const { limit, offset, search } = input;

			const conditions = [];
			if (search) {
				const searchLower = search.toLowerCase();
				conditions.push(
					sql`lower(${userTable.name}) LIKE ${`%${searchLower}%`} OR lower(${userTable.email}) LIKE ${`%${searchLower}%`} OR lower(${userTable.role}) LIKE ${`%${searchLower}%`}`,
				);
			}

			const whereClause =
				conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;

			const usersQuery = db
				.select({
					id: userTable.id,
					name: userTable.name,
					email: userTable.email,
					role: userTable.role,
					stationId: userTable.stationId,
					provinceId: userTable.provinceId,
					createdAt: userTable.createdAt,
				})
				.from(userTable)
				.where(whereClause);

			const countQuery = db
				.select({ count: sql<number>`count(*)` })
				.from(userTable)
				.where(whereClause);

			// Apply pagination if limit/offset are provided
			if (limit) usersQuery.limit(limit);
			if (offset) usersQuery.offset(offset);

			const [users, countResult] = await Promise.all([usersQuery, countQuery]);

			return {
				users,
				total: Number(countResult[0]?.count || 0),
			};
		}),

	// List all stations
	listStations: adminProcedure
		.output(
			z.array(
				z.object({
					id: z.string(),
					name: z.string(),
					cityId: z.string().nullable(),
					provinceId: z.string().nullable(),
					createdAt: z.date(),
				}),
			),
		)
		.handler(async () => {
			const stationsList = await db
				.select({
					id: stations.id,
					name: stations.name,
					cityId: stations.cityId,
					provinceId: stations.provinceId,
					createdAt: stations.createdAt,
				})
				.from(stations);

			return stationsList;
		}),

	// List all provinces
	listProvinces: adminProcedure
		.output(
			z.array(
				z.object({
					id: z.string(),
					name: z.string(),
					regionId: z.string().nullable(),
					createdAt: z.date(),
				}),
			),
		)
		.handler(async () => {
			const provincesList = await db
				.select({
					id: provinces.id,
					name: provinces.name,
					regionId: provinces.regionId,
					createdAt: provinces.createdAt,
				})
				.from(provinces);

			return provincesList;
		}),
	// Create a new user (Admin only)
	createUser: adminProcedure
		.input(
			z.object({
				name: z.string().min(2),
				email: z.string().email(),
				password: z.string().min(8),
				role: z.string(),
				stationId: z.string().optional(),
				provinceId: z.string().optional(),
			}),
		)
		.handler(async ({ input }) => {
			// Check if user exists
			const existing = await db
				.select()
				.from(userTable)
				.where(sql`email = ${input.email}`)
				.limit(1);

			if (existing.length > 0) {
				throw new Error("User with this email already exists");
			}

			// Create user using Programmatic Auth (no cookie side-effects)
			// This ensures correct hashing (compatible with BetterAuth) while preventing the Admin from being auto-logged in.
			const res = await programmaticAuth.api.signUpEmail({
				body: {
					email: input.email,
					password: input.password,
					name: input.name,
				},
			});

			if (!res?.user) {
				throw new Error("Failed to create user via Auth API");
			}

			const userId = res.user.id;

			// Update user with Role, Station, etc.
			await db
				.update(userTable)
				.set({
					role: input.role,
					stationId: input.stationId,
					provinceId: input.provinceId,
					// Force password change for new admin-created users
					mustChangePassword: true,
					updatedAt: new Date(),
				})
				.where(eq(userTable.id, userId));

			// Log audit event
			await logAudit({
				userId: userId,
				action: "USER_CREATE",
				entity: "user",
				entityId: userId,
				details: { name: input.name, email: input.email, role: input.role },
			});

			return { success: true };
		}),

	// Update user details (Role, Station, etc)
	updateUser: adminProcedure
		.input(
			z.object({
				id: z.string(),
				role: z.string().optional(),
				stationId: z.string().optional().nullable(),
				provinceId: z.string().optional().nullable(),
			}),
		)
		.handler(async ({ input, context }) => {
			// biome-ignore lint/suspicious/noExplicitAny: dynamic update object
			const updateData: any = {};
			if (input.role) updateData.role = input.role;
			if (input.stationId !== undefined) updateData.stationId = input.stationId;
			if (input.provinceId !== undefined)
				updateData.provinceId = input.provinceId;

			updateData.updatedAt = new Date();

			await db.update(userTable).set(updateData).where(sql`id = ${input.id}`);

			// Log audit event
			await logAudit({
				userId: context.session?.user?.id || "unknown",
				action: "USER_UPDATE",
				entity: "user",
				entityId: input.id,
				details: { changes: updateData },
			});

			return { success: true };
		}),

	// Delete a user
	deleteUser: adminProcedure
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.handler(async ({ input, context }) => {
			// Check if user exists first (optional, but good for logging details if we wanted to log name/email)
			// But for simple delete, we can just delete.
			// Better to fetch first to log who was deleted?
			const user = await db.query.user.findFirst({
				where: eq(userTable.id, input.id),
				columns: { name: true, email: true },
			});

			if (!user) {
				throw new Error("User not found");
			}

			// Prevent deleting yourself
			if (context.session?.user?.id === input.id) {
				throw new Error("You cannot delete your own account");
			}

			await db.delete(userTable).where(eq(userTable.id, input.id));

			// Log audit event
			await logAudit({
				userId: context.session?.user?.id || "unknown",
				action: "USER_DELETE",
				entity: "user",
				entityId: input.id,
				details: { name: user.name, email: user.email },
			});

			return { success: true };
		}),
};
