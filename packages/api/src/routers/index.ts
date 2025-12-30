import type { RouterClient } from "@orpc/server";

import { protectedProcedure, publicProcedure } from "../procedures";
import { adminRouter } from "./admin";
import { auditRouter } from "./audit";
import { inventoryRouter } from "./inventory";
import { logisticsRouter } from "./logistics";

export const appRouter = {
	healthCheck: publicProcedure.handler(() => {
		return "OK";
	}),
	privateData: protectedProcedure.handler(({ context }) => {
		return {
			message: "This is private",
			user: context.session?.user,
		};
	}),
	admin: adminRouter,
	audit: auditRouter,
	logistics: logisticsRouter,
	inventory: inventoryRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
