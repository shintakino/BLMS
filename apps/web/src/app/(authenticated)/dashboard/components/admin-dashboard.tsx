"use client";

import { useQuery } from "@tanstack/react-query";
import {
	Boxes,
	Building2,
	FileStack,
	MapPin,
	Package,
	Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import type { authClient } from "@/lib/auth-client";
import { client } from "@/utils/orpc";

export default function AdminDashboard({
	session,
}: {
	session: typeof authClient.$Infer.Session;
}) {
	// Fetch admin stats
	const { data: stats, isLoading } = useQuery({
		queryKey: ["admin", "stats"],
		queryFn: async () => {
			return await client.admin.stats({});
		},
	});

	return (
		<div className="space-y-6 font-mono text-xs">
			<div className="flex flex-wrap items-center justify-between gap-4 border-white/10 border-b pb-4">
				<h2 className="font-bold text-lg text-white uppercase tracking-wider">
					{"/// SYSTEM ADMINISTRATION PORTAL"}
				</h2>
				<p className="text-[10px] text-red-400 uppercase">
					Welcome, {session.user.name} | root.active
				</p>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				<Card className="console-card crosshair-corner rounded-none border-white/10">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-bold text-[10px] text-slate-400 uppercase">
							TOTAL USERS
						</CardTitle>
						<Users className="h-4 w-4 text-slate-400" />
					</CardHeader>
					<CardContent>
						<div className="font-black text-2xl text-white">
							{isLoading ? (
								<Skeleton className="h-8 w-12 bg-slate-800" />
							) : (
								stats?.totalUsers || 0
							)}
						</div>
						<p className="mt-1 text-[9px] text-slate-500 uppercase tracking-wider">
							Active system users
						</p>
					</CardContent>
				</Card>

				<Card className="console-card crosshair-corner rounded-none border-white/10">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-bold text-[10px] text-slate-400 uppercase">
							TOTAL STATIONS
						</CardTitle>
						<Building2 className="h-4 w-4 text-slate-400" />
					</CardHeader>
					<CardContent>
						<div className="font-black text-2xl text-white">
							{isLoading ? (
								<Skeleton className="h-8 w-12 bg-slate-800" />
							) : (
								stats?.totalStations || 0
							)}
						</div>
						<p className="mt-1 text-[9px] text-slate-500 uppercase tracking-wider">
							Registered fire stations
						</p>
					</CardContent>
				</Card>

				<Card className="console-card crosshair-corner rounded-none border-white/10">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-bold text-[10px] text-slate-400 uppercase">
							TOTAL REQUESTS
						</CardTitle>
						<FileStack className="h-4 w-4 text-slate-400" />
					</CardHeader>
					<CardContent>
						<div className="font-black text-2xl text-white">
							{isLoading ? (
								<Skeleton className="h-8 w-12 bg-slate-800" />
							) : (
								stats?.totalRequests || 0
							)}
						</div>
						<p className="mt-1 text-[9px] text-slate-500 uppercase tracking-wider">
							All logistics requests
						</p>
					</CardContent>
				</Card>

				<Card className="console-card crosshair-corner rounded-none border-white/10">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-bold text-[10px] text-slate-400 uppercase">
							PENDING REQUESTS
						</CardTitle>
						<FileStack className="h-4 w-4 animate-pulse text-yellow-500" />
					</CardHeader>
					<CardContent>
						<div className="font-black text-2xl text-yellow-500">
							{isLoading ? (
								<Skeleton className="h-8 w-12 bg-slate-800" />
							) : (
								stats?.pendingRequests || 0
							)}
						</div>
						<p className="mt-1 text-[9px] text-yellow-400 uppercase tracking-wider">
							Awaiting approval
						</p>
					</CardContent>
				</Card>

				<Card className="console-card crosshair-corner rounded-none border-white/10">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-bold text-[10px] text-slate-400 uppercase">
							PROVINCES
						</CardTitle>
						<MapPin className="h-4 w-4 text-slate-400" />
					</CardHeader>
					<CardContent>
						<div className="font-black text-2xl text-white">
							{isLoading ? (
								<Skeleton className="h-8 w-12 bg-slate-800" />
							) : (
								stats?.totalProvinces || 0
							)}
						</div>
						<p className="mt-1 text-[9px] text-slate-500 uppercase tracking-wider">
							Covered provinces
						</p>
					</CardContent>
				</Card>

				<Card className="console-card crosshair-corner rounded-none border-white/10">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-bold text-[10px] text-slate-400 uppercase">
							INVENTORY ITEMS
						</CardTitle>
						<Package className="h-4 w-4 text-slate-400" />
					</CardHeader>
					<CardContent>
						<div className="font-black text-2xl text-white">
							{isLoading ? (
								<Skeleton className="h-8 w-12 bg-slate-800" />
							) : (
								stats?.totalInventoryItems || 0
							)}
						</div>
						<p className="mt-1 text-[9px] text-slate-500 uppercase tracking-wider">
							Consumable supplies
						</p>
					</CardContent>
				</Card>

				<Card className="console-card crosshair-corner rounded-none border-white/10">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-bold text-[10px] text-slate-400 uppercase">
							TOTAL ASSETS
						</CardTitle>
						<Boxes className="h-4 w-4 text-slate-400" />
					</CardHeader>
					<CardContent>
						<div className="font-black text-2xl text-white">
							{isLoading ? (
								<Skeleton className="h-8 w-12 bg-slate-800" />
							) : (
								stats?.totalAssets || 0
							)}
						</div>
						<p className="mt-1 text-[9px] text-slate-500 uppercase tracking-wider">
							Equipment and assets
						</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
