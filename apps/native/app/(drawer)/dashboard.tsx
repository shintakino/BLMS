import { ActivityIndicator, Text, View } from "react-native";
import {
	AdminDashboard,
	RegionalDirectorDashboard,
	RLMDashboard,
	StationCommanderDashboard,
	SupplyOfficerDashboard,
} from "@/components/dashboards";
import { authClient } from "@/lib/auth-client";

export default function DashboardScreen() {
	const { data: session, isPending } = authClient.useSession();

	if (isPending) {
		return (
			<View className="flex-1 items-center justify-center bg-slate-950">
				<ActivityIndicator size="large" color="#ef4444" />
			</View>
		);
	}

	if (!session) {
		return (
			<View className="flex-1 items-center justify-center bg-slate-950 p-6">
				<Text className="font-mono text-red-500 text-xs uppercase">
					ERROR: NO AUTHENTICATED COMMAND SESSION FOUND
				</Text>
			</View>
		);
	}

	// biome-ignore lint/suspicious/noExplicitAny: user role typing is extended dynamically
	const role = (session.user as any).role || "";

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
				<View className="flex-1 items-center justify-center bg-slate-950 p-6">
					<Text className="mb-2 font-mono text-red-500 text-xs uppercase">
						ERROR: UNKNOWN COMMAND ROLE
					</Text>
					<Text className="font-mono text-[10px] text-slate-400 uppercase">
						ROLE: {role}
					</Text>
				</View>
			);
	}
}
