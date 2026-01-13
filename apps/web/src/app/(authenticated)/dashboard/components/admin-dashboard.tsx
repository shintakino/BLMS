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
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<h2 className="font-bold text-3xl tracking-tight">
					System Administration
				</h2>
				<p className="text-muted-foreground">Welcome, {session.user.name}</p>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Total Users</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{isLoading ? (
								<Skeleton className="h-8 w-12" />
							) : (
								stats?.totalUsers || 0
							)}
						</div>
						<p className="text-muted-foreground text-xs">Active system users</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Total Stations
						</CardTitle>
						<Building2 className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{isLoading ? (
								<Skeleton className="h-8 w-12" />
							) : (
								stats?.totalStations || 0
							)}
						</div>
						<p className="text-muted-foreground text-xs">
							Registered fire stations
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Total Requests
						</CardTitle>
						<FileStack className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{isLoading ? (
								<Skeleton className="h-8 w-12" />
							) : (
								stats?.totalRequests || 0
							)}
						</div>
						<p className="text-muted-foreground text-xs">
							All logistics requests
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Pending Requests
						</CardTitle>
						<FileStack className="h-4 w-4 text-yellow-500" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{isLoading ? (
								<Skeleton className="h-8 w-12" />
							) : (
								stats?.pendingRequests || 0
							)}
						</div>
						<p className="text-muted-foreground text-xs">Awaiting approval</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Provinces</CardTitle>
						<MapPin className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{isLoading ? (
								<Skeleton className="h-8 w-12" />
							) : (
								stats?.totalProvinces || 0
							)}
						</div>
						<p className="text-muted-foreground text-xs">Covered provinces</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Inventory Items
						</CardTitle>
						<Package className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{isLoading ? (
								<Skeleton className="h-8 w-12" />
							) : (
								stats?.totalInventoryItems || 0
							)}
						</div>
						<p className="text-muted-foreground text-xs">Consumable supplies</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Total Assets</CardTitle>
						<Boxes className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{isLoading ? (
								<Skeleton className="h-8 w-12" />
							) : (
								stats?.totalAssets || 0
							)}
						</div>
						<p className="text-muted-foreground text-xs">
							Equipment and assets
						</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
