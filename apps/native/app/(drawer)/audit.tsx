import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { ConsoleCard } from "@/components/console-ui";
import { client } from "@/utils/orpc";

export default function AuditScreen() {
	const { data: logs, isLoading } = useQuery({
		queryKey: ["audit-trail-list"],
		queryFn: async () => await client.audit.list({ limit: 30 }),
	});

	if (isLoading) {
		return (
			<View className="flex-1 items-center justify-center bg-slate-950">
				<ActivityIndicator size="large" color="#ef4444" />
			</View>
		);
	}

	return (
		<ScrollView className="flex-1 bg-slate-950 p-4">
			<View className="mb-4">
				<Text className="font-mono text-[10px] text-slate-500 uppercase">
					SECURE SYSTEM MONITORING ONLINE
				</Text>
				<Text className="mt-1 font-bold font-mono text-base text-white uppercase">
					IMMUTABLE AUDIT TRAIL
				</Text>
			</View>

			{logs?.logs && logs.logs.length > 0 ? (
				logs.logs.map((log: any) => {
					// Format dates cleanly
					const dateStr = new Date(log.createdAt).toLocaleString();
					const isAlert =
						log.action.includes("DELETE") ||
						log.action.includes("REJECT") ||
						log.action.includes("FAIL");

					return (
						<ConsoleCard
							key={log.id}
							title={log.action}
							variant={isAlert ? "critical" : "default"}
						>
							<Text className="font-mono text-white text-xs uppercase leading-snug">
								{log.details}
							</Text>
							<View className="mt-3 flex-row items-center justify-between border-white/5 border-t pt-2">
								<Text className="font-mono text-[8px] text-slate-500 uppercase">
									USER ID: {log.userId?.slice(0, 8) || "SYSTEM"}
								</Text>
								<Text className="font-mono text-[8px] text-slate-500 uppercase">
									{dateStr}
								</Text>
							</View>
						</ConsoleCard>
					);
				})
			) : (
				<ConsoleCard>
					<Text className="py-8 text-center font-mono text-slate-500 text-xs uppercase">
						NO AUDIT RECORDS FOUND IN CENTRAL DATABASE
					</Text>
				</ConsoleCard>
			)}
		</ScrollView>
	);
}
