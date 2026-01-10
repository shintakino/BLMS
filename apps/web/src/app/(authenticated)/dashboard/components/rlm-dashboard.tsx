import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
	AlertCircle,
	CheckSquare,
	ClipboardList,
	Eye,
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

export default function RLMDashboard({
	session,
}: {
	session: typeof authClient.$Infer.Session;
}) {
	const [page, setPage] = useState(1);
	const limit = 5;
	const queryClient = useQueryClient();

	// Fetch stats for accurate counters
	const { data: stats, isLoading: statsLoading } = useQuery({
		queryKey: ["requests-stats", "rlm"],
		queryFn: async () => await client.logistics.getStats(),
	});

	// Fetch paginated requests ready for consolidation/review (VALIDATED status)
	const { data: requests, isLoading: requestsLoading } = useQuery({
		queryKey: ["requests", "rlm", "validated", page],
		queryFn: async () => {
			return await client.logistics.list({
				status: "VALIDATED",
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

	const isLoading = requestsLoading || statsLoading;
	const reviewCount = stats?.validated || 0;

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="font-bold text-3xl tracking-tight">
					Regional Logistics
				</h2>
				<p className="text-muted-foreground">Welcome, {session.user.name}</p>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">For Review</CardTitle>
						<ClipboardList className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{isLoading ? <Skeleton className="h-8 w-8" /> : reviewCount}
						</div>
						<p className="text-muted-foreground text-xs">
							Requests pending consolidation
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Processed</CardTitle>
						<CheckSquare className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{isLoading ? (
								<Skeleton className="h-8 w-8" />
							) : (
								stats?.reviewed || 0
							)}
						</div>
						<p className="text-muted-foreground text-xs">
							Requests consolidated
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
			</div>

			<Card className="col-span-2">
				<CardHeader>
					<CardTitle>Pending Consolidation</CardTitle>
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
										<TableHead>Station</TableHead>
										<TableHead>Priority</TableHead>
										<TableHead>Validated By</TableHead>
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
														/* biome-ignore lint/suspicious/noExplicitAny: cast required for dynamic route */
														`/requests/${request.id}` as any
													}
													className="hover:underline"
												>
													{request.id.substring(0, 8)}...
												</Link>
											</TableCell>
											<TableCell>{request.stationId}</TableCell>
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
											<TableCell>{request.validatedBy || "-"}</TableCell>
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
												<RequestActions
													requestId={request.id}
													currentStatus={request.status}
													userRole="regional-logistics-manager"
												/>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>

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
							<p>No requests to review.</p>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
