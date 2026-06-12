import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
	ActivityIndicator,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";
import { authClient } from "@/lib/auth-client";
import { client } from "@/utils/orpc";
import { ConsoleButton, ConsoleCard, StatusBadge } from "./console-ui";

// ==========================================
// 1. SUPPLY OFFICER DASHBOARD
// ==========================================
export function SupplyOfficerDashboard() {
	const router = useRouter();

	const { data: stats, isLoading: statsLoading } = useQuery({
		queryKey: ["requests-stats", "supply-officer"],
		queryFn: async () => await client.logistics.getStats(),
	});

	const { data: recentRequests, isLoading: requestsLoading } = useQuery({
		queryKey: ["requests", "supply-officer", "recent"],
		queryFn: async () => await client.logistics.list({ limit: 10, offset: 0 }),
	});

	if (statsLoading || requestsLoading) {
		return (
			<View className="flex-1 items-center justify-center bg-slate-950 p-6">
				<ActivityIndicator size="large" color="#ef4444" />
			</View>
		);
	}

	return (
		<ScrollView className="flex-1 bg-slate-950 px-4 py-6">
			<View className="mb-6 flex-row items-center justify-between border-white/10 border-b pb-4">
				<View>
					<Text className="font-bold font-mono text-[10px] text-red-500 uppercase tracking-widest">
						ROLE: SUPPLY OFFICER
					</Text>
					<Text className="font-bold font-mono text-base text-white uppercase tracking-wider">
						STATION LOGISTICS CONSOLE
					</Text>
				</View>
				<ConsoleButton
					title="+ NEW"
					onPress={() => router.push("/requests/new")}
					className="px-3 py-2"
				/>
			</View>

			{/* Telemetry Cards Grid */}
			<View className="mb-6 flex-row flex-wrap justify-between">
				<View className="w-[48%]">
					<ConsoleCard title="PENDING">
						<Text className="font-black font-mono text-3xl text-white">
							{stats?.pending || 0}
						</Text>
						<Text className="mt-1 font-mono text-[8px] text-slate-500 uppercase">
							Awaiting action
						</Text>
					</ConsoleCard>
				</View>
				<View className="w-[48%]">
					<ConsoleCard title="DRAFTS">
						<Text className="font-black font-mono text-3xl text-white">
							{stats?.draft || 0}
						</Text>
						<Text className="mt-1 font-mono text-[8px] text-slate-500 uppercase">
							Unsubmitted
						</Text>
					</ConsoleCard>
				</View>
			</View>

			{/* Manifest List */}
			<Text className="mb-3 font-mono text-[10px] text-slate-400 uppercase tracking-wider">
				&gt; RECENT REQUEST MANIFESTS
			</Text>

			{recentRequests && recentRequests.length > 0 ? (
				recentRequests.map((req) => (
					<Pressable
						key={req.id}
						onPress={() => router.push(`/requests/${req.id}`)}
						className="mb-3 flex-row items-center justify-between border border-white/10 bg-slate-950/60 p-4 active:bg-slate-900"
					>
						<View className="flex-1 pr-4">
							<Text className="font-bold font-mono text-white text-xs uppercase">
								REQ-{req.id.slice(0, 8)}
							</Text>
							<Text className="mt-1 font-mono text-[9px] text-slate-500 uppercase">
								CREATED: {new Date(req.createdAt).toLocaleDateString()}
							</Text>
						</View>
						<View className="items-end">
							<StatusBadge status={req.status} />
							<Text className="mt-1 font-mono text-[8px] text-slate-500 uppercase">
								PRIO: {req.priority}
							</Text>
						</View>
					</Pressable>
				))
			) : (
				<ConsoleCard>
					<Text className="py-4 text-center font-mono text-slate-500 text-xs uppercase">
						NO REQUISITIONS FILED
					</Text>
				</ConsoleCard>
			)}
		</ScrollView>
	);
}

// ==========================================
// 2. STATION COMMANDER DASHBOARD
// ==========================================
export function StationCommanderDashboard({ session }: { session: any }) {
	const router = useRouter();

	const { data: stats, isLoading: statsLoading } = useQuery({
		queryKey: ["requests-stats", "station-commander"],
		queryFn: async () => await client.logistics.getStats(),
	});

	const { data: recentRequests, isLoading: requestsLoading } = useQuery({
		queryKey: ["requests", "station-commander", "recent"],
		queryFn: async () => await client.logistics.list({ limit: 10, offset: 0 }),
	});

	if (statsLoading || requestsLoading) {
		return (
			<View className="flex-1 items-center justify-center bg-slate-950 p-6">
				<ActivityIndicator size="large" color="#ef4444" />
			</View>
		);
	}

	return (
		<ScrollView className="flex-1 bg-slate-950 px-4 py-6">
			<View className="mb-6 border-white/10 border-b pb-4">
				<Text className="font-bold font-mono text-[10px] text-red-500 uppercase tracking-widest">
					ROLE: STATION COMMANDER
				</Text>
				<Text className="font-bold font-mono text-base text-white uppercase tracking-wider">
					COMMAND APPROVAL TERMINAL
				</Text>
			</View>

			{/* Telemetry Cards Grid */}
			<View className="mb-6 flex-row flex-wrap justify-between">
				<View className="w-[48%]">
					<ConsoleCard title="PENDING VALIDATION" variant="warning">
						<Text className="font-black font-mono text-3xl text-white">
							{stats?.pending || 0}
						</Text>
						<Text className="mt-1 font-mono text-[8px] text-slate-500 uppercase">
							Requires signature
						</Text>
					</ConsoleCard>
				</View>
				<View className="w-[48%]">
					<ConsoleCard title="APPROVED SYSTEM" variant="success">
						<Text className="font-black font-mono text-3xl text-white">
							{stats?.approved || 0}
						</Text>
						<Text className="mt-1 font-mono text-[8px] text-slate-500 uppercase">
							Dispatched items
						</Text>
					</ConsoleCard>
				</View>
			</View>

			{/* Request Pipeline */}
			<Text className="mb-3 font-mono text-[10px] text-slate-400 uppercase tracking-wider">
				&gt; PENDING REVIEW PIPELINE
			</Text>

			{recentRequests && recentRequests.length > 0 ? (
				recentRequests.map((req) => (
					<Pressable
						key={req.id}
						onPress={() => router.push(`/requests/${req.id}`)}
						className="mb-3 flex-row items-center justify-between border border-white/10 bg-slate-950/60 p-4 active:bg-slate-900"
					>
						<View className="flex-1 pr-4">
							<Text className="font-bold font-mono text-white text-xs uppercase">
								REQ-{req.id.slice(0, 8)}
							</Text>
							<Text className="mt-1 font-mono text-[9px] text-slate-500 uppercase">
								CREATED: {new Date(req.createdAt).toLocaleDateString()}
							</Text>
						</View>
						<View className="items-end">
							<StatusBadge status={req.status} />
							<Text className="mt-1 font-mono text-[8px] text-slate-500 uppercase">
								PRIO: {req.priority}
							</Text>
						</View>
					</Pressable>
				))
			) : (
				<ConsoleCard>
					<Text className="py-4 text-center font-mono text-slate-500 text-xs uppercase">
						NO REQUISITIONS TO VALIDATE
					</Text>
				</ConsoleCard>
			)}
		</ScrollView>
	);
}

// ==========================================
// 3. REGIONAL LOGISTICS MANAGER (RLM) DASHBOARD
// ==========================================
export function RLMDashboard({ session }: { session: any }) {
	const router = useRouter();

	const { data: stats, isLoading: statsLoading } = useQuery({
		queryKey: ["requests-stats", "rlm"],
		queryFn: async () => await client.logistics.getStats(),
	});

	const { data: recentRequests, isLoading: requestsLoading } = useQuery({
		queryKey: ["requests", "rlm", "recent"],
		queryFn: async () => await client.logistics.list({ limit: 10, offset: 0 }),
	});

	if (statsLoading || requestsLoading) {
		return (
			<View className="flex-1 items-center justify-center bg-slate-950 p-6">
				<ActivityIndicator size="large" color="#ef4444" />
			</View>
		);
	}

	return (
		<ScrollView className="flex-1 bg-slate-950 px-4 py-6">
			<View className="mb-6 border-white/10 border-b pb-4">
				<Text className="font-bold font-mono text-[10px] text-red-500 uppercase tracking-widest">
					ROLE: REGIONAL LOGISTICS MANAGER
				</Text>
				<Text className="font-bold font-mono text-base text-white uppercase tracking-wider">
					REGIONAL DISPATCH TERMINAL
				</Text>
			</View>

			{/* Telemetry Cards Grid */}
			<View className="mb-6 flex-row flex-wrap justify-between">
				<View className="w-[48%]">
					<ConsoleCard title="PENDING DISPATCH" variant="warning">
						<Text className="font-black font-mono text-3xl text-white">
							{stats?.pending || 0}
						</Text>
						<Text className="mt-1 font-mono text-[8px] text-slate-500 uppercase">
							Consolidated items
						</Text>
					</ConsoleCard>
				</View>
				<View className="w-[48%]">
					<ConsoleCard title="COMPLETED DISPATCH" variant="success">
						<Text className="font-black font-mono text-3xl text-white">
							{stats?.approved || 0}
						</Text>
						<Text className="mt-1 font-mono text-[8px] text-slate-500 uppercase">
							Nominal status
						</Text>
					</ConsoleCard>
				</View>
			</View>

			{/* Consolidations */}
			<Text className="mb-3 font-mono text-[10px] text-slate-400 uppercase tracking-wider">
				&gt; REGIONAL PIPELINE MANIFESTS
			</Text>

			{recentRequests && recentRequests.length > 0 ? (
				recentRequests.map((req) => (
					<Pressable
						key={req.id}
						onPress={() => router.push(`/requests/${req.id}`)}
						className="mb-3 flex-row items-center justify-between border border-white/10 bg-slate-950/60 p-4 active:bg-slate-900"
					>
						<View className="flex-1 pr-4">
							<Text className="font-bold font-mono text-white text-xs uppercase">
								REQ-{req.id.slice(0, 8)}
							</Text>
							<Text className="mt-1 font-mono text-[9px] text-slate-500 uppercase">
								STATION ID: {req.stationId?.slice(0, 8) || "N/A"}
							</Text>
						</View>
						<View className="items-end">
							<StatusBadge status={req.status} />
							<Text className="mt-1 font-mono text-[8px] text-slate-500 uppercase">
								PRIO: {req.priority}
							</Text>
						</View>
					</Pressable>
				))
			) : (
				<ConsoleCard>
					<Text className="py-4 text-center font-mono text-slate-500 text-xs uppercase">
						NO INCOMING MANIFESTS
					</Text>
				</ConsoleCard>
			)}
		</ScrollView>
	);
}

// ==========================================
// 4. REGIONAL DIRECTOR DASHBOARD
// ==========================================
export function RegionalDirectorDashboard({ session }: { session: any }) {
	const router = useRouter();

	const { data: stats, isLoading: statsLoading } = useQuery({
		queryKey: ["requests-stats", "rd"],
		queryFn: async () => await client.logistics.getStats(),
	});

	const { data: recentRequests, isLoading: requestsLoading } = useQuery({
		queryKey: ["requests", "rd", "recent"],
		queryFn: async () => await client.logistics.list({ limit: 10, offset: 0 }),
	});

	if (statsLoading || requestsLoading) {
		return (
			<View className="flex-1 items-center justify-center bg-slate-950 p-6">
				<ActivityIndicator size="large" color="#ef4444" />
			</View>
		);
	}

	return (
		<ScrollView className="flex-1 bg-slate-950 px-4 py-6">
			<View className="mb-6 border-white/10 border-b pb-4">
				<Text className="font-bold font-mono text-[10px] text-red-500 uppercase tracking-widest">
					ROLE: REGIONAL DIRECTOR
				</Text>
				<Text className="font-bold font-mono text-base text-white uppercase tracking-wider">
					TACTICAL METRICS MODULE
				</Text>
			</View>

			{/* Telemetry Cards Grid */}
			<View className="mb-6 flex-row flex-wrap justify-between">
				<View className="w-[31%]">
					<ConsoleCard title="PENDING">
						<Text className="font-black font-mono text-amber-500 text-xl">
							{stats?.pending || 0}
						</Text>
					</ConsoleCard>
				</View>
				<View className="w-[31%]">
					<ConsoleCard title="APPROVED">
						<Text className="font-black font-mono text-emerald-500 text-xl">
							{stats?.approved || 0}
						</Text>
					</ConsoleCard>
				</View>
				<View className="w-[31%]">
					<ConsoleCard title="REJECTED">
						<Text className="font-black font-mono text-red-500 text-xl">
							{stats?.rejected || 0}
						</Text>
					</ConsoleCard>
				</View>
			</View>

			{/* Regional Action Pipeline */}
			<Text className="mb-3 font-mono text-[10px] text-slate-400 uppercase tracking-wider">
				&gt; AUDIT MANIFEST QUEUE
			</Text>

			{recentRequests && recentRequests.length > 0 ? (
				recentRequests.map((req) => (
					<Pressable
						key={req.id}
						onPress={() => router.push(`/requests/${req.id}`)}
						className="mb-3 flex-row items-center justify-between border border-white/10 bg-slate-950/60 p-4 active:bg-slate-900"
					>
						<View className="flex-1 pr-4">
							<Text className="font-bold font-mono text-white text-xs uppercase">
								REQ-{req.id.slice(0, 8)}
							</Text>
							<Text className="mt-1 font-mono text-[9px] text-slate-500 uppercase">
								STATION: {req.stationId?.slice(0, 8) || "N/A"}
							</Text>
						</View>
						<View className="items-end">
							<StatusBadge status={req.status} />
							<Text className="mt-1 font-mono text-[8px] text-slate-500 uppercase">
								PRIO: {req.priority}
							</Text>
						</View>
					</Pressable>
				))
			) : (
				<ConsoleCard>
					<Text className="py-4 text-center font-mono text-slate-500 text-xs uppercase">
						NO REGIONAL AUDIT TELEMETRY
					</Text>
				</ConsoleCard>
			)}
		</ScrollView>
	);
}

// ==========================================
// 5. REGIONAL ADMIN DASHBOARD
// ==========================================
export function AdminDashboard({ session }: { session: any }) {
	const router = useRouter();
	const queryClient = useQueryClient();

	const { data: stats, isLoading: statsLoading } = useQuery({
		queryKey: ["requests-stats", "admin"],
		queryFn: async () => await client.logistics.getStats(),
	});

	const { data: logs } = useQuery({
		queryKey: ["admin-audit-logs"],
		queryFn: async () => await client.audit.list({ limit: 10 }),
	});

	if (statsLoading) {
		return (
			<View className="flex-1 items-center justify-center bg-slate-950 p-6">
				<ActivityIndicator size="large" color="#ef4444" />
			</View>
		);
	}

	return (
		<ScrollView className="flex-1 bg-slate-950 px-4 py-6">
			<View className="mb-6 flex-row items-center justify-between border-white/10 border-b pb-4">
				<View>
					<Text className="font-bold font-mono text-[10px] text-red-500 uppercase tracking-widest">
						ROLE: REGIONAL ADMIN
					</Text>
					<Text className="font-bold font-mono text-base text-white uppercase tracking-wider">
						SYSTEM COMMAND MODULE
					</Text>
				</View>
				<ConsoleButton
					title="SIGN OUT"
					variant="danger"
					onPress={async () => {
						await authClient.signOut();
						queryClient.refetchQueries();
						router.replace("/login");
					}}
					className="px-3 py-2"
				/>
			</View>

			{/* Telemetry Cards Grid */}
			<View className="mb-6 flex-row flex-wrap justify-between">
				<View className="w-[48%]">
					<ConsoleCard title="TOTAL TELEMETRY">
						<Text className="font-black font-mono text-3xl text-white">
							{(stats?.pending || 0) +
								(stats?.approved || 0) +
								(stats?.draft || 0)}
						</Text>
					</ConsoleCard>
				</View>
				<View className="w-[48%]">
					<ConsoleCard title="SYSTEM STATUS">
						<Text className="py-2 font-bold font-mono text-emerald-500 text-xs uppercase">
							[NOMINAL / ONLINE]
						</Text>
					</ConsoleCard>
				</View>
			</View>

			{/* System Audit logs */}
			<Text className="mb-3 font-mono text-[10px] text-slate-400 uppercase tracking-wider">
				&gt; CORE SYSTEM AUDIT LOGS
			</Text>

			{logs?.logs && logs.logs.length > 0 ? (
				logs.logs.map((log: any) => (
					<View
						key={log.id}
						className="mb-2 border border-white/10 bg-slate-950/60 p-3"
					>
						<Text className="font-mono text-[10px] text-slate-300 uppercase leading-snug">
							{log.action} - {log.details}
						</Text>
						<Text className="mt-1 font-mono text-[8px] text-slate-500 uppercase">
							USER: {log.userId?.slice(0, 8) || "SYSTEM"} |{" "}
							{new Date(log.createdAt).toLocaleDateString()}
						</Text>
					</View>
				))
			) : (
				<ConsoleCard>
					<Text className="py-4 text-center font-mono text-slate-500 text-xs uppercase">
						NO RECENT SYSTEM ACTIVITY
					</Text>
				</ConsoleCard>
			)}
		</ScrollView>
	);
}
