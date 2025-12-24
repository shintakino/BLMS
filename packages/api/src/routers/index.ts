import type { RouterClient } from "@orpc/server";

import { protectedProcedure, publicProcedure } from "../procedures";
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
	logistics: logisticsRouter,
	inventory: inventoryRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
