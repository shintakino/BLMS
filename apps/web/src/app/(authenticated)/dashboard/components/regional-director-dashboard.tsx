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
		<div className="space-y-6 font-mono text-xs">
			<div className="flex flex-wrap items-center justify-between gap-4 border-white/10 border-b pb-4">
				<h2 className="font-bold text-lg text-white uppercase tracking-wider">
					{"/// REGIONAL DIRECTOR OVERRIDE TERMINAL"}
				</h2>
				<p className="text-[10px] text-red-400 uppercase">
					Welcome, {session.user.name} | director.active
				</p>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<Card className="console-card crosshair-corner rounded-none border-white/10">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-bold text-[10px] text-slate-400 uppercase">
							TELEMETRY: PENDING APPROVAL
						</CardTitle>
						<FileCheck className="h-4 w-4 text-red-500" />
					</CardHeader>
					<CardContent>
						<div className="font-black text-2xl text-white">
							{isLoading ? (
								<Skeleton className="h-8 w-8 bg-slate-800" />
							) : (
								approvalCount
							)}
						</div>
						<p className="mt-1 text-[9px] text-red-400 uppercase tracking-wider">
							● ACTION REQUIRED
						</p>
					</CardContent>
				</Card>
				<Card className="console-card crosshair-corner rounded-none border-white/10">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-bold text-[10px] text-slate-400 uppercase">
							APPROVED DISPATCH MATRIX
						</CardTitle>
						<CheckCircle2 className="h-4 w-4 text-slate-400" />
					</CardHeader>
					<CardContent>
						<div className="font-black text-2xl text-white">
							{isLoading ? (
								<Skeleton className="h-8 w-8 bg-slate-800" />
							) : (
								stats?.approved || 0
							)}
						</div>
						<p className="mt-1 text-[9px] text-slate-500 uppercase tracking-wider">
							Requests approved this period
						</p>
					</CardContent>
				</Card>
				<Link href={"/stations" as any} className="block h-full">
					<Card className="console-card crosshair-corner h-full cursor-pointer rounded-none border-white/10 hover:border-red-500/30">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-bold text-[10px] text-slate-400 uppercase">
								ACTIVE REGIONAL STATIONS
							</CardTitle>
							<Store className="h-4 w-4 text-slate-400" />
						</CardHeader>
						<CardContent>
							<div className="font-black text-2xl text-white">
								{stationsLoading ? (
									<Skeleton className="h-8 w-8 bg-slate-800" />
								) : (
									stations?.length || 0
								)}
							</div>
							<p className="mt-1 text-[9px] text-slate-500 uppercase tracking-wider">
								[VIEW ACTIVE STATIONS]
							</p>
						</CardContent>
					</Card>
				</Link>
				<Link href={"/inventory" as any} className="block h-full">
					<Card className="console-card crosshair-corner h-full cursor-pointer rounded-none border-white/10 hover:border-red-500/30">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="font-bold text-[10px] text-slate-400 uppercase">
								REGIONAL INVENTORY
							</CardTitle>
							<Boxes className="h-4 w-4 text-slate-400" />
						</CardHeader>
						<CardContent>
							<div className="font-black text-2xl text-white">
								{inventoryLoading ? (
									<Skeleton className="h-8 w-8 bg-slate-800" />
								) : (
									totalInventoryCount
								)}
							</div>
							<p className="mt-1 text-[9px] text-slate-500 uppercase tracking-wider">
								[VIEW DISPOSITION]
							</p>
						</CardContent>
					</Card>
				</Link>
			</div>

			<Card className="console-card crosshair-corner col-span-1 rounded-none border-white/10 sm:col-span-2 lg:col-span-4">
				<CardHeader>
					<CardTitle className="font-bold text-slate-400 text-xs uppercase">
						PENDING DECISION MATRIX
					</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="space-y-2">
							<Skeleton className="h-10 w-full bg-slate-800" />
							<Skeleton className="h-10 w-full bg-slate-800" />
						</div>
					) : requests && requests.length > 0 ? (
						<div className="space-y-4">
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow className="border-white/10 border-b hover:bg-transparent">
											<TableHead className="whitespace-nowrap font-bold text-slate-400 uppercase">
												Request ID
											</TableHead>
											<TableHead className="whitespace-nowrap font-bold text-slate-400 uppercase">
												Station
											</TableHead>
											<TableHead className="whitespace-nowrap font-bold text-slate-400 uppercase">
												Priority
											</TableHead>
											<TableHead className="whitespace-nowrap font-bold text-slate-400 uppercase">
												Reviewed By
											</TableHead>
											<TableHead className="whitespace-nowrap font-bold text-slate-400 uppercase">
												Date
											</TableHead>
											<TableHead className="whitespace-nowrap text-right font-bold text-slate-400 uppercase">
												Actions
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{requests.map((request) => (
											<TableRow
												key={request.id}
												className="border-white/5 border-b hover:bg-white/5"
											>
												<TableCell className="whitespace-nowrap font-medium text-slate-300">
													<Link
														href={`/requests/${request.id}` as any}
														className="text-red-400 hover:underline"
													>
														{request.id.substring(0, 8)}...
													</Link>
												</TableCell>
												<TableCell className="whitespace-nowrap text-slate-300 uppercase">
													{request.station?.name || request.stationId}
												</TableCell>
												<TableCell className="whitespace-nowrap">
													<Badge
														variant={
															request.priority === "CRITICAL"
																? "destructive"
																: "outline"
														}
														className="rounded-none border-red-500/30 font-bold text-[9px] uppercase"
													>
														{request.priority}
													</Badge>
												</TableCell>
												<TableCell className="whitespace-nowrap text-slate-400 uppercase">
													{request.reviewer?.name || "-"}
												</TableCell>
												<TableCell className="whitespace-nowrap text-slate-400">
													{new Date(request.createdAt).toLocaleDateString()}
												</TableCell>
												<TableCell className="flex justify-end gap-2">
													<Button
														className="h-8 rounded-none border border-foreground bg-slate-900 font-bold text-[10px] text-white uppercase shadow-[2px_2px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000]"
														asChild
													>
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
															<Eye className="mr-2 h-3 w-3" />
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
													: "cursor-pointer rounded-none border border-white/10 bg-slate-900 text-[10px] uppercase"
											}
										/>
									</PaginationItem>
									<PaginationItem>
										<PaginationLink
											href="#"
											isActive
											className="rounded-none border border-white/20 bg-red-600 font-bold text-[10px] text-white"
										>
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
													: "cursor-pointer rounded-none border border-white/10 bg-slate-900 text-[10px] uppercase"
											}
										/>
									</PaginationItem>
								</PaginationContent>
							</Pagination>
						</div>
					) : (
						<div className="flex h-32 flex-col items-center justify-center text-slate-500">
							<AlertCircle className="mb-2 h-8 w-8 text-red-500/40" />
							<p className="uppercase tracking-wider">No pending approvals.</p>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
