import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	Text,
	TextInput,
	View,
} from "react-native";
import { ConsoleButton, ConsoleCard } from "@/components/console-ui";
import { client } from "@/utils/orpc";

type Priority = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";

interface ItemInput {
	itemName: string;
	quantity: number;
	category: string;
	key: string;
}

export default function NewRequestScreen() {
	const router = useRouter();
	const queryClient = useQueryClient();

	const [priority, setPriority] = useState<Priority>("NORMAL");
	const [justification, setJustification] = useState("");
	const [items, setItems] = useState<ItemInput[]>([
		{ itemName: "", quantity: 1, category: "PPE", key: "initial" },
	]);
	const [error, setError] = useState<string | null>(null);

	const createMutation = useMutation({
		mutationFn: async (data: any) => await client.logistics.create(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["requests"] });
			queryClient.invalidateQueries({ queryKey: ["requests-stats"] });
			router.replace("/(drawer)");
		},
		onError: (err: any) => {
			setError(err.message?.toUpperCase() || "REQUEST SUBMISSION FAILED");
		},
	});

	const handleAddItem = () => {
		setItems([
			...items,
			{
				itemName: "",
				quantity: 1,
				category: "General",
				key: Math.random().toString(36).substring(7),
			},
		]);
	};

	const handleRemoveItem = (key: string) => {
		if (items.length === 1) return;
		setItems(items.filter((item) => item.key !== key));
	};

	const handleUpdateItem = (
		key: string,
		field: keyof ItemInput,
		value: any,
	) => {
		setItems(
			items.map((item) => {
				if (item.key === key) {
					return { ...item, [field]: value };
				}
				return item;
			}),
		);
	};

	const handleFormSubmit = (status: "DRAFT" | "SUBMITTED") => {
		setError(null);

		// Validate items
		const invalidItem = items.some(
			(item) => !item.itemName.trim() || item.quantity <= 0,
		);
		if (invalidItem) {
			setError("ALL ITEMS MUST HAVE A VALID NAME AND QUANTITY > 0");
			return;
		}

		if (!justification.trim() || justification.trim().length < 10) {
			setError("JUSTIFICATION MUST BE AT LEAST 10 CHARACTERS");
			return;
		}

		const formattedItems = items.map(({ itemName, quantity, category }) => ({
			itemName: itemName.trim(),
			quantity,
			category: category.trim() || "General",
		}));

		// Satisfies API schema requiring at least 1 attachment
		const attachments = [
			{
				url: "https://bfp.gov.ph/signature.png",
				name: "mobile_command_signature.png",
				type: "image/png",
			},
		];

		createMutation.mutate({
			priority,
			justification: justification.trim(),
			items: formattedItems,
			attachments,
			status,
		});
	};

	const isLoading = createMutation.isPending;

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			className="flex-1 bg-slate-950"
		>
			{/* Header */}
			<View className="mt-6 flex-row items-center justify-between border-white/10 border-b bg-slate-950 px-4 py-4">
				<Text className="font-bold font-mono text-white text-xs uppercase">
					{"/// NEW REQUISITION FORM"}
				</Text>
				<ConsoleButton
					title="BACK"
					variant="secondary"
					onPress={() => router.back()}
					className="px-2 py-1"
				/>
			</View>

			<ScrollView className="flex-1 p-4">
				{error ? (
					<View className="mb-4 border border-red-600 bg-red-950/40 p-3">
						<Text className="font-mono text-red-400 text-xs uppercase">
							ERROR: {error}
						</Text>
					</View>
				) : null}

				{/* Priority Staging */}
				<Text className="mb-2 font-mono text-[10px] text-slate-400 uppercase">
					REQUEST PRIORITY LEVEL:
				</Text>
				<View className="mb-4 flex-row justify-between">
					{(["LOW", "NORMAL", "HIGH", "CRITICAL"] as Priority[]).map((p) => {
						const active = priority === p;
						return (
							<Pressable
								key={p}
								onPress={() => setPriority(p)}
								className={`w-[23%] items-center border p-2 ${
									active
										? "border-red-500 bg-red-950/40"
										: "border-white/10 bg-slate-900/50"
								}`}
							>
								<Text
									className={`font-bold font-mono text-[9px] ${active ? "text-red-400" : "text-slate-400"}`}
								>
									{p}
								</Text>
							</Pressable>
						);
					})}
				</View>

				{/* Justification */}
				<Text className="mb-2 font-mono text-[10px] text-slate-400 uppercase">
					OPERATIONAL JUSTIFICATION:
				</Text>
				<TextInput
					className="mb-4 min-h-[80px] rounded-none border border-white/10 bg-slate-950/60 p-3 font-mono text-sm text-white"
					placeholder="DESCRIBE WHY THESE ASSETS ARE REQUIRED FOR STATION READINESS..."
					placeholderTextColor="rgba(255,255,255,0.3)"
					value={justification}
					onChangeText={setJustification}
					multiline
					numberOfLines={3}
					autoCorrect={false}
					editable={!isLoading}
				/>

				{/* Items Manifest */}
				<View className="mb-3 flex-row items-center justify-between">
					<Text className="font-mono text-[10px] text-slate-400 uppercase">
						ITEMS MANIFEST:
					</Text>
					<ConsoleButton
						title="+ ADD ITEM"
						variant="secondary"
						onPress={handleAddItem}
						className="px-2 py-1"
					/>
				</View>

				{items.map((item, index) => (
					<ConsoleCard
						key={item.key}
						title={`ITEM MANIFEST INDEX #${index + 1}`}
						headerRight={
							items.length > 1 ? (
								<Pressable
									onPress={() => handleRemoveItem(item.key)}
									className="px-2 py-1"
								>
									<Text className="font-bold font-mono text-[9px] text-red-500 uppercase">
										[REMOVE]
									</Text>
								</Pressable>
							) : null
						}
					>
						<Text className="mb-1 font-mono text-[9px] text-slate-400 uppercase">
							ITEM SPECIFICATION / NAME:
						</Text>
						<TextInput
							className="mb-3 rounded-none border border-white/10 bg-slate-950/60 p-2 font-mono text-white text-xs"
							placeholder="E.G. SCBA CYLINDER 4500 PSI"
							placeholderTextColor="rgba(255,255,255,0.3)"
							value={item.itemName}
							onChangeText={(text) =>
								handleUpdateItem(item.key, "itemName", text)
							}
							autoCapitalize="characters"
							autoCorrect={false}
							editable={!isLoading}
						/>

						<View className="flex-row justify-between">
							<View className="w-[48%]">
								<Text className="mb-1 font-mono text-[9px] text-slate-400 uppercase">
									CATEGORY:
								</Text>
								<TextInput
									className="rounded-none border border-white/10 bg-slate-950/60 p-2 font-mono text-white text-xs"
									placeholder="E.G. PPE"
									placeholderTextColor="rgba(255,255,255,0.3)"
									value={item.category}
									onChangeText={(text) =>
										handleUpdateItem(item.key, "category", text)
									}
									autoCapitalize="characters"
									autoCorrect={false}
									editable={!isLoading}
								/>
							</View>
							<View className="w-[48%]">
								<Text className="mb-1 font-mono text-[9px] text-slate-400 uppercase">
									QUANTITY:
								</Text>
								<TextInput
									className="rounded-none border border-white/10 bg-slate-950/60 p-2 font-mono text-white text-xs"
									placeholder="1"
									placeholderTextColor="rgba(255,255,255,0.3)"
									value={item.quantity.toString()}
									onChangeText={(text) => {
										const num =
											Number.parseInt(text.replace(/[^0-9]/g, "")) || 0;
										handleUpdateItem(item.key, "quantity", num);
									}}
									keyboardType="numeric"
									editable={!isLoading}
								/>
							</View>
						</View>
					</ConsoleCard>
				))}

				{/* Submit Actions */}
				<View className="mt-4 mb-8 space-y-3">
					<ConsoleButton
						title={
							isLoading ? "PROCESSING REQUISITION..." : "TRANSMIT REQUISITION"
						}
						onPress={() => handleFormSubmit("SUBMITTED")}
						isLoading={isLoading}
					/>
					<ConsoleButton
						title="SAVE AS DRAFT"
						variant="secondary"
						onPress={() => handleFormSubmit("DRAFT")}
						isLoading={isLoading}
					/>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}
