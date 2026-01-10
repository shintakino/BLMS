"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle, Eye, Package } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
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
	const [page, setPage] = React.useState(1);
	const limit = 5;

	// Fetch stats for accurate counters
	const { data: stats, isLoading: statsLoading } = useQuery({
		queryKey: ["requests-stats", "station-commander"],
		queryFn: async () => await client.logistics.getStats(),
	});

	// Fetch paginated requests
	const { data: requests, isLoading: requestsLoading } = useQuery({
		// Include page in queryKey to trigger refetch on change
		queryKey: ["requests", "station-commander", "submitted", page],
		queryFn: async () => {
			return await client.logistics.list({
				status: "SUBMITTED",
				limit,
				offset: (page - 1) * limit,
			});
		},
	});

	const isLoading = requestsLoading || statsLoading;

	const { data: inventoryData, isLoading: inventoryLoading } = useQuery({
		queryKey: ["inventory", "station-commander"],
		queryFn: async () => await client.inventory.list({}),
	});

	const queryClient = useQueryClient();

	React.useEffect(() => {
		if (requests) {
			for (const request of requests) {
				queryClient.prefetchQuery({
					queryKey: ["request", request.id],
					queryFn: async () => await client.logistics.get({ id: request.id }),
					staleTime: 1000 * 60 * 5, // 5 minutes
				});
			}
		}
	}, [requests, queryClient]);

	const pendingCount = stats?.submitted || 0; // "To Validate" means SUBMITTED specifically

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
						<div className="font-bold text-2xl">
							{inventoryLoading || !inventoryData ? (
								<Skeleton className="h-8 w-8" />
							) : (
								(inventoryData.inventory.length || 0) +
								(inventoryData.assets.length || 0)
							)}
						</div>
						<p className="text-muted-foreground text-xs">Manage assets</p>
						<Link
							/* biome-ignore lint/suspicious/noExplicitAny: cast required for dynamic route */
							href={"/inventory" as any}
							className="mt-2 inline-block text-blue-600 text-xs hover:underline"
						>
							View Full Inventory
						</Link>

						{inventoryData && (
							<div className="mt-4 flex flex-col gap-2 border-t pt-4">
								<Link
									/* biome-ignore lint/suspicious/noExplicitAny: typed routes issue */
									href={"/transfers" as any}
									className="mt-4 block text-center text-muted-foreground text-xs hover:underline"
								>
									Manage Incoming/Outgoing Transfers
								</Link>
							</div>
						)}
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
						<div className="space-y-4">
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
												{request.creator?.name || request.createdBy}
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
												<Button variant="outline" size="sm" asChild>
													<Link
														href={`/requests/${request.id}`}
														onMouseEnter={() => {
															queryClient.prefetchQuery({
																queryKey: ["request", request.id],
																queryFn: async () =>
																	await client.logistics.get({
																		id: request.id,
																	}),
																staleTime: 1000 * 60 * 5,
															});
														}}
													>
														<Eye className="mr-2 h-4 w-4" />
														View
													</Link>
												</Button>
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

							{/* Pagination Controls */}
							<Pagination>
								<PaginationContent>
									<PaginationItem>
										<PaginationPrevious
											href="#"
											onClick={(e) => {
												e.preventDefault();
												if (page > 1) setPage(page - 1);
											}}
											className={
												page === 1
													? "pointer-events-none opacity-50"
													: "cursor-pointer"
											}
										/>
									</PaginationItem>
									<PaginationItem>
										<PaginationLink href="#" isActive>
											{page}
										</PaginationLink>
									</PaginationItem>
									<PaginationItem>
										<PaginationNext
											href="#"
											onClick={(e) => {
												e.preventDefault();
												// If we got 'limit' amounts, there might be more
												if (requests && requests.length === limit)
													setPage(page + 1);
											}}
											className={
												!requests || requests.length < limit
													? "pointer-events-none opacity-50"
													: "cursor-pointer"
											}
										/>
									</PaginationItem>
								</PaginationContent>
							</Pagination>
						</div>
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
