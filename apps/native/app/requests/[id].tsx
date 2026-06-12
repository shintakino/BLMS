import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	Text,
	TextInput,
	View,
} from "react-native";
import {
	ConsoleButton,
	ConsoleCard,
	StatusBadge,
} from "@/components/console-ui";
import { authClient } from "@/lib/auth-client";
import { client } from "@/utils/orpc";

export default function RequestDetailsScreen() {
	const router = useRouter();
	const { id } = useLocalSearchParams<{ id: string }>();
	const queryClient = useQueryClient();
	const { data: session } = authClient.useSession();
	const [remarks, setRemarks] = useState("");
	const [error, setError] = useState<string | null>(null);

	// biome-ignore lint/suspicious/noExplicitAny: user role extends dynamically
	const userRole = (session?.user as any)?.role || "";

	// Fetch request details
	const {
		data: request,
		isLoading,
		error: fetchError,
	} = useQuery({
		queryKey: ["request", id],
		queryFn: async () => await client.logistics.get({ id: id as string }),
		enabled: !!id,
	});

	// Mutations
	const validateRequest = useMutation({
		mutationFn: (data: {
			requestId: string;
			action: "VALIDATE" | "REJECT";
			remarks?: string;
		}) => client.logistics.validate(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["request", id] });
			queryClient.invalidateQueries({ queryKey: ["requests"] });
			queryClient.invalidateQueries({ queryKey: ["requests-stats"] });
			router.replace("/(drawer)");
		},
		onError: (err: any) => {
			setError(err.message?.toUpperCase() || "VALIDATION FAILED");
		},
	});

	const consolidateRequest = useMutation({
		mutationFn: (data: {
			requestId: string;
			action: "REVIEW" | "REJECT";
			remarks?: string;
		}) => client.logistics.consolidate(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["request", id] });
			queryClient.invalidateQueries({ queryKey: ["requests"] });
			queryClient.invalidateQueries({ queryKey: ["requests-stats"] });
			router.replace("/(drawer)");
		},
		onError: (err: any) => {
			setError(err.message?.toUpperCase() || "CONSOLIDATION FAILED");
		},
	});

	const finalApproveRequest = useMutation({
		mutationFn: (data: {
			requestId: string;
			action: "APPROVE" | "REJECT";
			remarks?: string;
		}) => client.logistics.finalApprove(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["request", id] });
			queryClient.invalidateQueries({ queryKey: ["requests"] });
			queryClient.invalidateQueries({ queryKey: ["requests-stats"] });
			router.replace("/(drawer)");
		},
		onError: (err: any) => {
			setError(err.message?.toUpperCase() || "FINAL APPROVAL FAILED");
		},
	});

	const submitRequest = useMutation({
		mutationFn: (data: { requestId: string }) => client.logistics.submit(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["request", id] });
			queryClient.invalidateQueries({ queryKey: ["requests"] });
			queryClient.invalidateQueries({ queryKey: ["requests-stats"] });
			router.replace("/(drawer)");
		},
		onError: (err: any) => {
			setError(err.message?.toUpperCase() || "SUBMISSION FAILED");
		},
	});

	const deleteRequest = useMutation({
		mutationFn: (data: { requestId: string }) => client.logistics.delete(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["requests"] });
			queryClient.invalidateQueries({ queryKey: ["requests-stats"] });
			router.replace("/(drawer)");
		},
		onError: (err: any) => {
			setError(err.message?.toUpperCase() || "DELETE FAILED");
		},
	});

	if (isLoading) {
		return (
			<View className="flex-1 items-center justify-center bg-slate-950">
				<ActivityIndicator size="large" color="#ef4444" />
			</View>
		);
	}

	if (fetchError || !request) {
		return (
			<View className="flex-1 items-center justify-center bg-slate-950 p-6">
				<Text className="font-mono text-red-500 text-xs uppercase">
					ERROR: LOAD FAILURE OR PERMISSION DENIED
				</Text>
				<ConsoleButton
					title="RETURN"
					variant="secondary"
					onPress={() => router.back()}
					className="mt-4 px-4 py-2"
				/>
			</View>
		);
	}

	const isMutating =
		validateRequest.isPending ||
		consolidateRequest.isPending ||
		finalApproveRequest.isPending ||
		submitRequest.isPending ||
		deleteRequest.isPending;

	// Render action terminal based on current status and user role
	const renderActionTerminal = () => {
		if (request.status === "DRAFT" && userRole === "supply-officer") {
			return (
				<ConsoleCard title="DRAFT ACTIONS TERMINAL">
					<ConsoleButton
						title="TRANSMIT REQUISITION"
						variant="primary"
						onPress={() => submitRequest.mutate({ requestId: request.id })}
						isLoading={isMutating}
						className="mb-2"
					/>
					<ConsoleButton
						title="DELETE REQUISITION"
						variant="danger"
						onPress={() => deleteRequest.mutate({ requestId: request.id })}
						isLoading={isMutating}
					/>
				</ConsoleCard>
			);
		}

		if (request.status === "SUBMITTED" && userRole === "station-commander") {
			return (
				<ConsoleCard title="COMMANDER SIGN-OFF PANEL">
					<Text className="mb-1 font-mono text-[9px] text-slate-400 uppercase">
						VALIDATION REMARKS:
					</Text>
					<TextInput
						className="mb-3 rounded-none border border-white/10 bg-slate-950/60 p-2 font-mono text-white text-xs"
						placeholder="ENTER REMARKS PRIOR TO SIGNING..."
						placeholderTextColor="rgba(255,255,255,0.3)"
						value={remarks}
						onChangeText={setRemarks}
						editable={!isMutating}
					/>
					<ConsoleButton
						title="APPROVE & SIGN"
						variant="success"
						onPress={() =>
							validateRequest.mutate({
								requestId: request.id,
								action: "VALIDATE",
								remarks,
							})
						}
						isLoading={isMutating}
						className="mb-2"
					/>
					<ConsoleButton
						title="REJECT REQUISITION"
						variant="danger"
						onPress={() =>
							validateRequest.mutate({
								requestId: request.id,
								action: "REJECT",
								remarks,
							})
						}
						isLoading={isMutating}
					/>
				</ConsoleCard>
			);
		}

		if (
			request.status === "VALIDATED" &&
			userRole === "regional-logistics-manager"
		) {
			return (
				<ConsoleCard title="RLM DISPATCH PANEL">
					<Text className="mb-1 font-mono text-[9px] text-slate-400 uppercase">
						CONSOLIDATION NOTES:
					</Text>
					<TextInput
						className="mb-3 rounded-none border border-white/10 bg-slate-950/60 p-2 font-mono text-white text-xs"
						placeholder="ENTER CONSOLIDATION REMARKS..."
						placeholderTextColor="rgba(255,255,255,0.3)"
						value={remarks}
						onChangeText={setRemarks}
						editable={!isMutating}
					/>
					<ConsoleButton
						title="REVIEW & FORWARD"
						variant="success"
						onPress={() =>
							consolidateRequest.mutate({
								requestId: request.id,
								action: "REVIEW",
								remarks,
							})
						}
						isLoading={isMutating}
						className="mb-2"
					/>
					<ConsoleButton
						title="REJECT BACK TO STATION"
						variant="danger"
						onPress={() =>
							consolidateRequest.mutate({
								requestId: request.id,
								action: "REJECT",
								remarks,
							})
						}
						isLoading={isMutating}
					/>
				</ConsoleCard>
			);
		}

		if (request.status === "REVIEWED" && userRole === "regional-director") {
			return (
				<ConsoleCard title="DIRECTOR FINAL APPROVAL PANEL">
					<Text className="mb-1 font-mono text-[9px] text-slate-400 uppercase">
						DIRECTIVE REMARKS:
					</Text>
					<TextInput
						className="mb-3 rounded-none border border-white/10 bg-slate-950/60 p-2 font-mono text-white text-xs"
						placeholder="ENTER FINAL DIRECTIVE OR OVERRIDES..."
						placeholderTextColor="rgba(255,255,255,0.3)"
						value={remarks}
						onChangeText={setRemarks}
						editable={!isMutating}
					/>
					<ConsoleButton
						title="FINAL RELEASE ORDER"
						variant="success"
						onPress={() =>
							finalApproveRequest.mutate({
								requestId: request.id,
								action: "APPROVE",
								remarks,
							})
						}
						isLoading={isMutating}
						className="mb-2"
					/>
					<ConsoleButton
						title="DENY REQUISITION"
						variant="danger"
						onPress={() =>
							finalApproveRequest.mutate({
								requestId: request.id,
								action: "REJECT",
								remarks,
							})
						}
						isLoading={isMutating}
					/>
				</ConsoleCard>
			);
		}

		return null;
	};

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			className="flex-1 bg-slate-950"
		>
			{/* Header */}
			<View className="mt-6 flex-row items-center justify-between border-white/10 border-b bg-slate-950 px-4 py-4">
				<Text className="font-bold font-mono text-white text-xs uppercase">
					{"/// REQUISITION DETAILS"}
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

				{/* Primary Info */}
				<ConsoleCard title={`MANIFEST ID: REQ-${request.id.slice(0, 8)}`}>
					<View className="space-y-2">
						<View className="flex-row justify-between">
							<Text className="font-mono text-[10px] text-slate-400 uppercase">
								STATUS:
							</Text>
							<StatusBadge status={request.status} />
						</View>
						<View className="flex-row justify-between">
							<Text className="font-mono text-[10px] text-slate-400 uppercase">
								PRIORITY:
							</Text>
							<Text className="font-bold font-mono text-[10px] text-white uppercase">
								{request.priority}
							</Text>
						</View>
						<View className="flex-row justify-between">
							<Text className="font-mono text-[10px] text-slate-400 uppercase">
								CREATED ON:
							</Text>
							<Text className="font-mono text-[10px] text-slate-300">
								{new Date(request.createdAt).toLocaleString()}
							</Text>
						</View>
					</View>
				</ConsoleCard>

				{/* Justification */}
				<ConsoleCard title="OPERATIONAL JUSTIFICATION">
					<Text className="font-mono text-slate-300 text-xs uppercase leading-snug">
						{request.justification || "NO JUSTIFICATION PROVIDED"}
					</Text>
				</ConsoleCard>

				{/* Items list */}
				<Text className="mb-2 font-mono text-[10px] text-slate-400 uppercase">
					&gt; ITEMS MANIFEST:
				</Text>
				{request.items && request.items.length > 0 ? (
					request.items.map((item, idx) => (
						<View
							key={item.id || idx}
							className="mb-2 flex-row items-center justify-between border border-white/5 bg-slate-950/60 p-3"
						>
							<View className="flex-1 pr-4">
								<Text className="font-bold font-mono text-white text-xs uppercase">
									{item.itemName}
								</Text>
								<Text className="mt-1 font-mono text-[9px] text-slate-500 uppercase">
									CAT: {item.category}
								</Text>
							</View>
							<Text className="font-black font-mono text-sm text-white">
								x{item.quantity}
							</Text>
						</View>
					))
				) : (
					<ConsoleCard>
						<Text className="py-4 text-center font-mono text-slate-500 text-xs uppercase">
							NO ITEMS SPECIFIED
						</Text>
					</ConsoleCard>
				)}

				{/* Action form */}
				<View className="mt-4 mb-8">{renderActionTerminal()}</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}
