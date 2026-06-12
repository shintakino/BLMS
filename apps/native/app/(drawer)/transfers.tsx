import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "heroui-native";
import { useState } from "react";
import {
	ActivityIndicator,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";
import { ConsoleButton, ConsoleCard } from "@/components/console-ui";
import { authClient } from "@/lib/auth-client";
import { client } from "@/utils/orpc";

export default function TransfersScreen() {
	const queryClient = useQueryClient();
	const { data: session } = authClient.useSession();
	const [activeTab, setActiveTab] = useState<"incoming" | "outgoing">(
		"incoming",
	);

	// biome-ignore lint/suspicious/noExplicitAny: user role extends dynamically
	const userRole = (session?.user as any)?.role || "";
	const isStationCommander = userRole === "station-commander";
	const userStationId = (session?.user as any)?.stationId || "";

	// Fetch transfers list
	const { data: transfers, isLoading } = useQuery({
		queryKey: ["transfers"],
		queryFn: async () => await client.inventory.listTransfers(),
	});

	// Complete or Cancel transfer mutation
	const completeTransfer = useMutation({
		mutationFn: async (data: {
			transferId: string;
			action: "COMPLETE" | "CANCEL";
		}) => {
			await client.inventory.completeTransfer(data);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["transfers"] });
			queryClient.invalidateQueries({ queryKey: ["inventory"] });
		},
	});

	if (isLoading) {
		return (
			<View className="flex-1 items-center justify-center bg-slate-950">
				<ActivityIndicator size="large" color="#ef4444" />
			</View>
		);
	}

	// Filter incoming vs outgoing transfers
	const incomingTransfers =
		transfers?.filter((t) => t.toStationId === userStationId) || [];
	const outgoingTransfers =
		transfers?.filter((t) => t.fromStationId === userStationId) || [];
	const currentList =
		activeTab === "incoming" ? incomingTransfers : outgoingTransfers;

	return (
		<View className="flex-1 bg-slate-950">
			{/* Tab Headers */}
			<View className="flex-row border-white/10 border-b">
				<Pressable
					onPress={() => setActiveTab("incoming")}
					className={cn(
						"flex-1 items-center border-b-2 py-3",
						activeTab === "incoming"
							? "border-red-500 bg-slate-900/40"
							: "border-transparent",
					)}
				>
					<Text
						className={cn(
							"font-bold font-mono text-xs uppercase",
							activeTab === "incoming" ? "text-red-400" : "text-slate-500",
						)}
					>
						INCOMING ({incomingTransfers.length})
					</Text>
				</Pressable>
				<Pressable
					onPress={() => setActiveTab("outgoing")}
					className={cn(
						"flex-1 items-center border-b-2 py-3",
						activeTab === "outgoing"
							? "border-red-500 bg-slate-900/40"
							: "border-transparent",
					)}
				>
					<Text
						className={cn(
							"font-bold font-mono text-xs uppercase",
							activeTab === "outgoing" ? "text-red-400" : "text-slate-500",
						)}
					>
						OUTGOING ({outgoingTransfers.length})
					</Text>
				</Pressable>
			</View>

			<ScrollView className="flex-1 p-4">
				{currentList.length > 0 ? (
					currentList.map((tr) => (
						<ConsoleCard
							key={tr.id}
							title={`TRANS-${tr.id.slice(0, 8)}`}
							variant={
								tr.status === "PENDING"
									? "warning"
									: tr.status === "COMPLETED"
										? "success"
										: "default"
							}
						>
							<Text className="font-bold font-mono text-white text-xs uppercase">
								ASSET: {tr.asset?.name}
							</Text>
							{tr.asset?.serialNumber ? (
								<Text className="mt-1 font-mono text-[9px] text-slate-500 uppercase">
									S/N: {tr.asset.serialNumber}
								</Text>
							) : null}

							<View className="my-2 mt-3 space-y-1 border-white/5 border-t border-b py-2">
								<Text className="font-mono text-[9px] text-slate-400 uppercase">
									FROM: {tr.fromStation?.name}
								</Text>
								<Text className="font-mono text-[9px] text-slate-400 uppercase">
									TO: {tr.toStation?.name}
								</Text>
							</View>

							{tr.remarks ? (
								<Text className="mt-1 font-mono text-[9px] text-slate-500 uppercase italic">
									REMARKS: {tr.remarks}
								</Text>
							) : null}

							<View className="mt-3 flex-row items-center justify-between">
								<Text className="font-mono text-[9px] text-slate-400 uppercase">
									STATUS: <Text className="font-bold">{tr.status}</Text>
								</Text>

								{/* Actions: only for Station Commander, and only for PENDING transfers */}
								{isStationCommander &&
								tr.status === "PENDING" &&
								activeTab === "incoming" ? (
									<View className="flex-row gap-2">
										<ConsoleButton
											title="COMPLETE"
											variant="success"
											onPress={() =>
												completeTransfer.mutate({
													transferId: tr.id,
													action: "COMPLETE",
												})
											}
											className="px-2 py-1"
										/>
										<ConsoleButton
											title="CANCEL"
											variant="danger"
											onPress={() =>
												completeTransfer.mutate({
													transferId: tr.id,
													action: "CANCEL",
												})
											}
											className="px-2 py-1"
										/>
									</View>
								) : null}
							</View>
						</ConsoleCard>
					))
				) : (
					<ConsoleCard>
						<Text className="py-8 text-center font-mono text-slate-500 text-xs uppercase">
							NO TRANSFERS RECORDED IN THIS PIPELINE
						</Text>
					</ConsoleCard>
				)}
			</ScrollView>
		</View>
	);
}
