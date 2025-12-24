"use client";

import { useQuery } from "@tanstack/react-query";
import { Building2, FileStack, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import type { authClient } from "@/lib/auth-client";
import { client } from "@/utils/orpc";

export default function AdminDashboard({
	session,
}: {
	session: typeof authClient.$Infer.Session;
}) {
	// Fetch generic stats for admin
	// For now, let's just count total requests as we don't have a specific `stats` endpoint exposed yet.
	// We can list all requests and count them.
	const { data: requests, isLoading } = useQuery({
		queryKey: ["requests", "admin", "all"],
		queryFn: async () => {
			return await client.logistics.list({});
		},
	});

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="font-bold text-3xl tracking-tight">
					System Administration
				</h2>
				<p className="text-muted-foreground">Welcome, {session.user.name}</p>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Total Users</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">-</div>
						<p className="text-muted-foreground text-xs">Active system users</p>
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
								<Skeleton className="h-8 w-8" />
							) : (
								requests?.length || 0
							)}
						</div>
						<p className="text-muted-foreground text-xs">
							All logistics requests
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Stations</CardTitle>
						<Building2 className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">-</div>
						<p className="text-muted-foreground text-xs">
							Registered fire stations
						</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
