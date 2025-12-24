"use client";

import type { authClient } from "@/lib/auth-client";
import AdminDashboard from "./components/admin-dashboard";
import RegionalDirectorDashboard from "./components/regional-director-dashboard";
import RLMDashboard from "./components/rlm-dashboard";
import StationCommanderDashboard from "./components/station-commander-dashboard";
import SupplyOfficerDashboard from "./components/supply-officer-dashboard";

export default function Dashboard({
	session,
}: {
	session: typeof authClient.$Infer.Session;
}) {
	// biome-ignore lint/suspicious/noExplicitAny: role property missing in inferred types
	const role = (session.user as any).role;

	switch (role) {
		case "supply-officer":
			return <SupplyOfficerDashboard />;
		case "station-commander":
			return <StationCommanderDashboard session={session} />;
		case "regional-logistics-manager":
			return <RLMDashboard session={session} />;
		case "regional-director":
			return <RegionalDirectorDashboard session={session} />;
		case "regional-admin":
			return <AdminDashboard session={session} />;
		default:
			return (
				<div className="p-4">
					<h1 className="font-bold text-2xl">Unknown Role</h1>
					<p>Your role ({role}) does not have a dashboard configured.</p>
				</div>
			);
	}
}
