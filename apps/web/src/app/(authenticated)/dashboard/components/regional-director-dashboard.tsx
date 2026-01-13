"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
	AlertCircle,
	Boxes,
	CheckCircle2,
	Eye,
	FileCheck,
	Store,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
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

export default function RegionalDirectorDashboard({
	session,
}: {
	session: typeof authClient.$Infer.Session;
}) {
	const [page, setPage] = useState(1);
	const limit = 5;
	const queryClient = useQueryClient();

	// Fetch stats for accurate counters
	const { data: stats, isLoading: statsLoading } = useQuery({
		queryKey: ["requests-stats", "rd"],
		queryFn: async () => await client.logistics.getStats(),
	});

	// Fetch paginated requests ready for final approval (REVIEWED status)
	const { data: requests, isLoading: requestsLoading } = useQuery({
		queryKey: ["requests", "rd", "reviewed", page],
		queryFn: async () => {
			return await client.logistics.list({
				status: "REVIEWED",
				limit,
				offset: (page - 1) * limit,
			});
		},
	});

	// Fetch all stations
	const { data: stations, isLoading: stationsLoading } = useQuery({
		queryKey: ["stations-list"],
		queryFn: async () => await client.inventory.listStations(),
	});

	// Fetch all inventory for regional overview
	const { data: inventoryData, isLoading: inventoryLoading } = useQuery({
		queryKey: ["inventory-all"],
		queryFn: async () => await client.inventory.listAll(),
	});

	const isLoading = requestsLoading || statsLoading;
	const approvalCount = stats?.reviewed || 0;
	const totalInventoryCount =
		(inventoryData?.inventory?.length || 0) +
		(inventoryData?.assets?.length || 0);

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<h2 className="font-bold text-3xl tracking-tight">Regional Director</h2>
				<p className="text-muted-foreground">Welcome, {session.user.name}</p>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Pending Approvals
						</CardTitle>
						<FileCheck className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{isLoading ? <Skeleton className="h-8 w-8" /> : approvalCount}
						</div>
						<p className="text-muted-foreground text-xs">
							Requests awaiting final decision
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Approved</CardTitle>
						<CheckCircle2 className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{isLoading ? (
								<Skeleton className="h-8 w-8" />
							) : (
								stats?.approved || 0
							)}
						</div>
						<p className="text-muted-foreground text-xs">
							Requests approved this period
						</p>
					</CardContent>
				</Card>
				<Link
					href={
						/* biome-ignore lint/suspicious/noExplicitAny: valid new route */
						"/stations" as any
					}
				>
					<Card className="h-full cursor-pointer transition-colors hover:bg-muted/50">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								Total Stations
							</CardTitle>
							<Store className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">
								{stationsLoading ? (
									<Skeleton className="h-8 w-8" />
								) : (
									stations?.length || 0
								)}
							</div>
							<p className="text-muted-foreground text-xs">
								Active stations in region
							</p>
						</CardContent>
					</Card>
				</Link>
				<Link
					href={
						/* biome-ignore lint/suspicious/noExplicitAny: valid route */
						"/inventory" as any
					}
				>
					<Card className="h-full cursor-pointer transition-colors hover:bg-muted/50">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-medium text-sm">
								Regional Inventory
							</CardTitle>
							<Boxes className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">
								{inventoryLoading ? (
									<Skeleton className="h-8 w-8" />
								) : (
									totalInventoryCount
								)}
							</div>
							<p className="text-muted-foreground text-xs">
								Total items across all stations
							</p>
						</CardContent>
					</Card>
				</Link>
			</div>

			<Card className="col-span-1 sm:col-span-2 lg:col-span-4">
				<CardHeader>
					<CardTitle>Approvals Required</CardTitle>
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
												Station
											</TableHead>
											<TableHead className="whitespace-nowrap">
												Priority
											</TableHead>
											<TableHead className="whitespace-nowrap">
												Reviewed By
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
															/* biome-ignore lint/suspicious/noExplicitAny: cast required for dynamic route */
															`/requests/${request.id}` as any
														}
														className="hover:underline"
													>
														{request.id.substring(0, 8)}...
													</Link>
												</TableCell>
												<TableCell className="whitespace-nowrap">
													{request.station?.name || request.stationId}
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
													{request.reviewer?.name || "-"}
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
													<RequestActions
														requestId={request.id}
														currentStatus={request.status}
														userRole="regional-director"
													/>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>

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
							<p>No pending approvals.</p>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
