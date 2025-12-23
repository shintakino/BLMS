import { ORPCError, os } from "@orpc/server";

import type { Context } from "./context";

export const o = os.$context<Context>();

export const publicProcedure = o;

const requireAuth = o.middleware(async ({ context, next }) => {
	if (!context.session?.user) {
		throw new ORPCError("UNAUTHORIZED");
	}
	return next({
		context: {
			session: context.session,
		},
	});
});

export const protectedProcedure = publicProcedure.use(requireAuth);

export const supplyOfficerProcedure = protectedProcedure.use(
	async ({ context, next }) => {
		if (context.session.user.role !== "supply-officer") {
			throw new ORPCError("FORBIDDEN", {
				message: "Requires Supply Officer role",
			});
		}
		return next({ context });
	},
);

export const stationCommanderProcedure = protectedProcedure.use(
	async ({ context, next }) => {
		if (context.session.user.role !== "station-commander") {
			throw new ORPCError("FORBIDDEN", {
				message: "Requires Station Commander role",
			});
		}
		return next({ context });
	},
);

export const rlmProcedure = protectedProcedure.use(
	async ({ context, next }) => {
		if (context.session.user.role !== "regional-logistics-manager") {
			throw new ORPCError("FORBIDDEN", {
				message: "Requires Regional Logistics Manager role",
			});
		}
		return next({ context });
	},
);

export const regionalDirectorProcedure = protectedProcedure.use(
	async ({ context, next }) => {
		if (context.session.user.role !== "regional-director") {
			throw new ORPCError("FORBIDDEN", {
				message: "Requires Regional Director role",
			});
		}
		return next({ context });
	},
);

export const adminProcedure = protectedProcedure.use(
	async ({ context, next }) => {
		const role = context.session.user.role;
		if (role !== "regional-admin" && role !== "regional-director") {
			throw new ORPCError("FORBIDDEN", { message: "Requires Admin access" });
		}
		return next({ context });
	},
);

export * from "./routers/logistics";
