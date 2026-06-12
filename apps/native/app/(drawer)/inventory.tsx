import { useQuery } from "@tanstack/react-query";
import { cn } from "heroui-native";
import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";
import { ConsoleCard } from "@/components/console-ui";
import { authClient } from "@/lib/auth-client";
import { client } from "@/utils/orpc";

export default function InventoryScreen() {
	const { data: session } = authClient.useSession();
	const [selectedStationId, setSelectedStationId] = useState<string>("");

	// biome-ignore lint/suspicious/noExplicitAny: user role extends dynamically
	const userRole = (session?.user as any)?.role || "";
	const isRegional = [
		"regional-logistics-manager",
		"regional-director",
		"regional-admin",
	].includes(userRole);

	// Fetch stations list (only needed if regional)
	const { data: stations } = useQuery({
		queryKey: ["stations-list"],
		queryFn: async () => await client.inventory.listStations(),
		enabled: isRegional,
	});

	// Automatically select the first station when stations list loads
	useEffect(() => {
		if (isRegional && stations && stations.length > 0 && !selectedStationId) {
			setSelectedStationId(stations[0].id);
		}
	}, [stations, isRegional, selectedStationId]);

	// Fetch inventory items
	const { data: inventoryItems, isLoading: isInventoryLoading } = useQuery({
		queryKey: ["inventory-list", isRegional ? selectedStationId : "local"],
		queryFn: async () => {
			if (isRegional) {
				return await client.inventory.list({ stationId: selectedStationId });
			}
			return await client.inventory.list({});
		},
		enabled: !isRegional || !!selectedStationId,
	});

	return (
		<View className="flex-1 bg-slate-950">
			{/* Regional Station Selector */}
			{isRegional && stations && stations.length > 0 ? (
				<View className="border-white/10 border-b bg-slate-950/80 py-3">
					<Text className="mb-2 px-4 font-mono text-[9px] text-slate-500 uppercase">
						SELECT STATION FOR TELEMETRY:
					</Text>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						className="px-4"
					>
						{stations.map((st) => {
							const active = selectedStationId === st.id;
							return (
								<Pressable
									key={st.id}
									onPress={() => setSelectedStationId(st.id)}
									className={cn(
										"mr-2 rounded-none border px-3 py-2",
										active
											? "border-red-500 bg-red-950/40"
											: "border-white/10 bg-slate-900/50",
									)}
								>
									<Text
										className={cn(
											"font-bold font-mono text-[10px] uppercase",
											active ? "text-red-400" : "text-slate-400",
										)}
									>
										{st.name}
									</Text>
								</Pressable>
							);
						})}
					</ScrollView>
				</View>
			) : null}

			{isInventoryLoading ? (
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator size="large" color="#ef4444" />
				</View>
			) : (
				<ScrollView className="flex-1 p-4">
					<View className="mb-4">
						<Text className="font-mono text-[10px] text-slate-500 uppercase">
							DATABASE ACTIVE / SECURITY VERIFIED
						</Text>
						<Text className="mt-1 font-bold font-mono text-base text-white uppercase">
							{isRegional ? "REGIONAL ASSET MATRIX" : "LOCAL STATION STOCKS"}
						</Text>
					</View>

					{inventoryItems?.inventory && inventoryItems.inventory.length > 0 ? (
						inventoryItems.inventory.map((item: any) => (
							<View
								key={item.id}
								className="mb-3 flex-row items-center justify-between rounded-none border border-white/10 bg-slate-950/60 p-4"
							>
								<View className="flex-1 pr-4">
									<Text className="font-bold font-mono text-white text-xs uppercase">
										{item.itemName}
									</Text>
									<Text className="mt-1 font-mono text-[9px] text-slate-500 uppercase">
										CAT: {item.category}
									</Text>
								</View>
								<View className="items-end">
									<Text className="font-black font-mono text-base text-white">
										{item.quantity}
									</Text>
									<Text className="mt-1 font-mono text-[9px] text-slate-400 uppercase">
										{item.unit || "PCS"}
									</Text>
								</View>
							</View>
						))
					) : (
						<ConsoleCard>
							<Text className="py-8 text-center font-mono text-slate-500 text-xs uppercase">
								NO INVENTORY ITEMS RECORDED
							</Text>
						</ConsoleCard>
					)}
				</ScrollView>
			)}
		</View>
	);
}
