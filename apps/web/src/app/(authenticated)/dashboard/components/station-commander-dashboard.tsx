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
		<div className="space-y-6 font-mono text-xs">
			<div className="flex flex-wrap items-center justify-between gap-4 border-white/10 border-b pb-4">
				<h2 className="font-bold text-lg text-white uppercase tracking-wider">
					{"/// STATION COMMAND CONSOLE"}
				</h2>
				<p className="text-[10px] text-red-400 uppercase">
					Welcome, {session.user.name} | terminal.active
				</p>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<Card className="console-card crosshair-corner rounded-none border-white/10">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-bold text-[10px] text-slate-400 uppercase">
							TELEMETRY: PENDING VALIDATION
						</CardTitle>
						<CheckCircle className="h-4 w-4 text-red-500" />
					</CardHeader>
					<CardContent>
						<div className="font-black text-2xl text-white">
							{isLoading ? <Skeleton className="h-8 w-8" /> : pendingCount}
						</div>
						<p className="mt-1 text-[9px] text-red-400 uppercase tracking-wider">
							● ACTION REQUIRED
						</p>
					</CardContent>
				</Card>
				<Card className="console-card crosshair-corner rounded-none border-white/10">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-bold text-[10px] text-slate-400 uppercase">
							STATION INVENTORY disposition
						</CardTitle>
						<Package className="h-4 w-4 text-slate-400" />
					</CardHeader>
					<CardContent>
						<div className="font-black text-2xl text-white">
							{inventoryLoading || !inventoryData ? (
								<Skeleton className="h-8 w-8" />
							) : (
								(inventoryData.inventory.length || 0) +
								(inventoryData.assets.length || 0)
							)}
						</div>
						<p className="mt-1 text-[9px] text-slate-500 uppercase tracking-wider">
							active monitored units
						</p>
						<div className="mt-4 flex gap-4 border-white/5 border-t pt-4 text-[10px]">
							<Link
								href={"/inventory" as any}
								className="text-red-400 hover:underline"
							>
								[VIEW DISPOSITION]
							</Link>
							{inventoryData && (
								<Link
									href={"/transfers" as any}
									className="text-slate-400 hover:underline"
								>
									[MANAGE TRANSFERS]
								</Link>
							)}
						</div>
					</CardContent>
				</Card>
			</div>

			<Card className="console-card crosshair-corner col-span-1 rounded-none border-white/10 sm:col-span-2">
				<CardHeader>
					<CardTitle className="font-bold text-slate-400 text-xs uppercase">
						PENDING VALIDATIONS MATRIX
					</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="space-y-2">
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-10 w-full" />
						</div>
					) : requests && requests.length > 0 ? (
						<div className="space-y-4">
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="whitespace-nowrap">
												Request ID
											</TableHead>
											<TableHead className="whitespace-nowrap">
												Requested By
											</TableHead>
											<TableHead className="whitespace-nowrap">
												Priority
											</TableHead>
											<TableHead className="whitespace-nowrap">Date</TableHead>
											<TableHead className="whitespace-nowrap text-right">
												Actions
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{requests.map((request) => (
											<TableRow key={request.id}>
												<TableCell className="whitespace-nowrap font-medium">
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
												<TableCell className="whitespace-nowrap">
													{request.creator?.name || request.createdBy}
												</TableCell>
												<TableCell className="whitespace-nowrap">
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
												<TableCell className="whitespace-nowrap">
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
							</div>

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
