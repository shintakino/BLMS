"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle, Package } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { authClient } from "@/lib/auth-client";
import { client } from "@/utils/orpc";
import RequestActions from "../../requests/[id]/components/request-actions";

export default function StationCommanderDashboard({
	session,
}: {
	session: typeof authClient.$Infer.Session;
}) {
	// Fetch requests that need validation (SUBMITTED status)
	// In a real app, we might filter by stationId if the API doesn't do it automatically based on user context.
	// Assuming client.logistics.list filters by user's station/role visibility.
	const { data: requests, isLoading } = useQuery({
		queryKey: ["requests", "station-commander", "submitted"],
		queryFn: async () => {
			// Fetch all and filter client side for now if API doesn't support status filter param yet
			// Or better, assume list() returns relevant items.
			const allC = await client.logistics.list({});
			return allC.filter((r) => r.status === "SUBMITTED");
		},
	});

	const pendingCount = requests?.length || 0;

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="font-bold text-3xl tracking-tight">Station Command</h2>
				<p className="text-muted-foreground">Welcome, {session.user.name}</p>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">To Validate</CardTitle>
						<CheckCircle className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{isLoading ? <Skeleton className="h-8 w-8" /> : pendingCount}
						</div>
						<p className="text-muted-foreground text-xs">
							Requests requiring your attention
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Station Inventory
						</CardTitle>
						<Package className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">-</div>
						<p className="text-muted-foreground text-xs">Manage assets</p>
						<Link
							/* biome-ignore lint/suspicious/noExplicitAny: cast required for dynamic route */
							href={"/inventory" as any}
							className="mt-2 inline-block text-blue-600 text-xs hover:underline"
						>
							View Full Inventory
						</Link>
					</CardContent>
				</Card>
			</div>

			<Card className="col-span-2">
				<CardHeader>
					<CardTitle>Pending Validations</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="space-y-2">
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-10 w-full" />
						</div>
					) : requests && requests.length > 0 ? (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Request ID</TableHead>
									<TableHead>Requested By</TableHead>
									<TableHead>Priority</TableHead>
									<TableHead>Date</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{requests.map((request) => (
									<TableRow key={request.id}>
										<TableCell className="font-medium">
											<Link
												href={
													/* biome-ignore lint/suspicious/noExplicitAny: Temporary cast for Link href */
													`/requests/${request.id}` as any
												}
												className="hover:underline"
											>
												{request.id.substring(0, 8)}...
											</Link>
										</TableCell>
										<TableCell>
											{request.createdBy}{" "}
											{/* Should be username but API might return ID */}
										</TableCell>
										<TableCell>
											<Badge
												variant={
													request.priority === "CRITICAL"
														? "destructive"
														: "outline"
												}
											>
												{request.priority}
											</Badge>
										</TableCell>
										<TableCell>
											{new Date(request.createdAt).toLocaleDateString()}
										</TableCell>
										<TableCell className="flex justify-end gap-2">
											{/* Reuse the RequestActions component for consistent logic */}
											<RequestActions
												requestId={request.id}
												currentStatus={request.status}
												userRole="station-commander"
											/>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					) : (
						<div className="flex h-32 flex-col items-center justify-center text-muted-foreground">
							<AlertCircle className="mb-2 h-8 w-8 opacity-20" />
							<p>No requests pending validation.</p>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
