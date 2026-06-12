# BFP Regional Logistics Management System UI & Design Redesign Plan

> **For execution:** This plan details how to finalize the web application's UI overhaul, specifically targeting the remaining role dashboards, ensuring they match the authoritative, high-density **"Tactical Command Console"** design system.

**Goal:** Complete the redesign of all role-based dashboards in the BLMS web application to replace the generic layouts with the high-density console cards, monospace metrics, and crosshair corners.

**Tech Stack:** Next.js, Framer Motion, Tailwind CSS v4, Lucide React, Vitest.

---

### Task 1: Clean Up Main Dashboard Entry Layout

Remove the generic placeholder text (`<h1>Dashboard</h1>`, etc.) from the server page component so it doesn't double-render alongside the role-specific dashboards.

**File:**
- Modify: `apps/web/src/app/(authenticated)/dashboard/page.tsx`

**Implementation Details:**
Replace the return block in [page.tsx](file:///D:/dev/personal/BLMS/apps/web/src/app/(authenticated)/dashboard/page.tsx#L16-L23) with a clean container wrapping only the dynamic `<Dashboard>` dispatch component:

```tsx
	return (
		<div className="p-6">
			<Dashboard session={session} />
		</div>
	);
```

---

### Task 2: Redesign Regional Logistics Manager (RLM) Dashboard

Apply the console theme, sharp borders, red indicators, and monospace font structure.

**File:**
- Modify: `apps/web/src/app/(authenticated)/dashboard/components/rlm-dashboard.tsx`

**Implementation Details:**
Overhaul the layout to wrap all cards and lists with the dark console aesthetics:

```tsx
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
		<div className="space-y-6 font-mono text-xs">
			<div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
				<h2 className="font-bold text-lg uppercase tracking-wider text-white">
					{"/// REGIONAL LOGISTICS CONSOLE"}
				</h2>
				<p className="text-red-400 text-[10px] uppercase">Welcome, {session.user.name} | terminal.active</p>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<Card className="console-card crosshair-corner rounded-none border-white/10">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-bold text-[10px] text-slate-400 uppercase">TELEMETRY: PENDING CONSOLIDATION</CardTitle>
						<ClipboardList className="h-4 w-4 text-red-500" />
					</CardHeader>
					<CardContent>
						<div className="font-black text-2xl text-white">
							{isLoading ? <Skeleton className="h-8 w-8 bg-slate-800" /> : reviewCount}
						</div>
						<p className="text-red-400 text-[9px] uppercase tracking-wider mt-1">
							● ACTION REQUIRED
						</p>
					</CardContent>
				</Card>
				<Card className="console-card crosshair-corner rounded-none border-white/10">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-bold text-[10px] text-slate-400 uppercase">CONSOLIDATED DISPATCH STAGING</CardTitle>
						<CheckSquare className="h-4 w-4 text-slate-400" />
					</CardHeader>
					<CardContent>
						<div className="font-black text-2xl text-white">
							{isLoading ? (
								<Skeleton className="h-8 w-8 bg-slate-800" />
							) : (
								stats?.reviewed || 0
							)}
						</div>
						<p className="text-slate-500 text-[9px] uppercase tracking-wider mt-1">
							Requests consolidated
						</p>
					</CardContent>
				</Card>
				<Link
					href={
						"/stations" as any
					}
					className="block h-full"
				>
					<Card className="console-card crosshair-corner rounded-none border-white/10 h-full cursor-pointer hover:border-red-500/30">
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
							<p className="text-slate-500 text-[9px] uppercase tracking-wider mt-1">
								[VIEW ACTIVE STATIONS]
							</p>
						</CardContent>
					</Card>
				</Link>
			</div>

			<Card className="console-card crosshair-corner rounded-none border-white/10 col-span-1 sm:col-span-2 lg:col-span-3">
				<CardHeader>
					<CardTitle className="text-xs font-bold text-slate-400 uppercase">PENDING CONSOLIDATION MANIFESTS</CardTitle>
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
										<TableRow className="border-b border-white/10 hover:bg-transparent">
											<TableHead className="whitespace-nowrap text-slate-400 font-bold uppercase">
												Request ID
											</TableHead>
											<TableHead className="whitespace-nowrap text-slate-400 font-bold uppercase">
												Station
											</TableHead>
											<TableHead className="whitespace-nowrap text-slate-400 font-bold uppercase">
												Priority
											</TableHead>
											<TableHead className="whitespace-nowrap text-slate-400 font-bold uppercase">
												Validated By
											</TableHead>
											<TableHead className="whitespace-nowrap text-slate-400 font-bold uppercase">Date</TableHead>
											<TableHead className="whitespace-nowrap text-right text-slate-400 font-bold uppercase">
												Actions
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{requests.map((request) => (
											<TableRow key={request.id} className="border-b border-white/5 hover:bg-white/5">
												<TableCell className="whitespace-nowrap font-medium text-slate-300">
													<Link
														href={
															`/requests/${request.id}` as any
														}
														className="hover:underline text-red-400"
													>
														{request.id.substring(0, 8)}...
													</Link>
												</TableCell>
												<TableCell className="whitespace-nowrap uppercase text-slate-300">
													{request.station?.name || request.stationId}
												</TableCell>
												<TableCell className="whitespace-nowrap">
													<Badge
														variant={
															request.priority === "CRITICAL"
																? "destructive"
																: "outline"
														}
														className="rounded-none border-red-500/30 text-[9px] uppercase font-bold"
													>
														{request.priority}
													</Badge>
												</TableCell>
												<TableCell className="whitespace-nowrap uppercase text-slate-400">
													{request.validator?.name || "-"}
												</TableCell>
												<TableCell className="whitespace-nowrap text-slate-400">
													{new Date(request.createdAt).toLocaleDateString()}
												</TableCell>
												<TableCell className="flex justify-end gap-2">
													<Button className="h-8 rounded-none border border-foreground bg-slate-900 text-white font-bold text-[10px] uppercase shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] transition-all" asChild>
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
														userRole="regional-logistics-manager"
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
													: "cursor-pointer uppercase text-[10px] border border-white/10 rounded-none bg-slate-900"
											}
										/>
									</PaginationItem>
									<PaginationItem>
										<PaginationLink href="#" isActive className="rounded-none border border-white/20 bg-red-600 text-white font-bold text-[10px]">
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
													: "cursor-pointer uppercase text-[10px] border border-white/10 rounded-none bg-slate-900"
											}
										/>
									</PaginationItem>
								</PaginationContent>
							</Pagination>
						</div>
					) : (
						<div className="flex h-32 flex-col items-center justify-center text-slate-500">
							<AlertCircle className="mb-2 h-8 w-8 text-red-500/40" />
							<p className="uppercase tracking-wider">No requests pending review.</p>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
```

---

### Task 3: Redesign Regional Director (RD) Dashboard

Apply same structural aesthetics and custom telemetry metrics to final approval queues.

**File:**
- Modify: `apps/web/src/app/(authenticated)/dashboard/components/regional-director-dashboard.tsx`

**Implementation Details:**
Overhaul the layout to represent an authoritative command override control room interface:

```tsx
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
			<div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
				<h2 className="font-bold text-lg uppercase tracking-wider text-white">
					{"/// REGIONAL DIRECTOR OVERRIDE TERMINAL"}
				</h2>
				<p className="text-red-400 text-[10px] uppercase">Welcome, {session.user.name} | director.active</p>
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
							{isLoading ? <Skeleton className="h-8 w-8 bg-slate-800" /> : approvalCount}
						</div>
						<p className="text-red-400 text-[9px] uppercase tracking-wider mt-1">
							● ACTION REQUIRED
						</p>
					</CardContent>
				</Card>
				<Card className="console-card crosshair-corner rounded-none border-white/10">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-bold text-[10px] text-slate-400 uppercase">APPROVED DISPATCH MATRIX</CardTitle>
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
						<p className="text-slate-500 text-[9px] uppercase tracking-wider mt-1">
							Requests approved this period
						</p>
					</CardContent>
				</Card>
				<Link
					href={
						"/stations" as any
					}
					className="block h-full"
				>
					<Card className="console-card crosshair-corner rounded-none border-white/10 h-full cursor-pointer hover:border-red-500/30">
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
							<p className="text-slate-500 text-[9px] uppercase tracking-wider mt-1">
								[VIEW ACTIVE STATIONS]
							</p>
						</CardContent>
					</Card>
				</Link>
				<Link
					href={
						"/inventory" as any
					}
					className="block h-full"
				>
					<Card className="console-card crosshair-corner rounded-none border-white/10 h-full cursor-pointer hover:border-red-500/30">
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
							<p className="text-slate-500 text-[9px] uppercase tracking-wider mt-1">
								[VIEW DISPOSITION]
							</p>
						</CardContent>
					</Card>
				</Link>
			</div>

			<Card className="console-card crosshair-corner rounded-none border-white/10 col-span-1 sm:col-span-2 lg:col-span-4">
				<CardHeader>
					<CardTitle className="text-xs font-bold text-slate-400 uppercase">PENDING DECISION MATRIX</CardTitle>
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
										<TableRow className="border-b border-white/10 hover:bg-transparent">
											<TableHead className="whitespace-nowrap text-slate-400 font-bold uppercase">
												Request ID
											</TableHead>
											<TableHead className="whitespace-nowrap text-slate-400 font-bold uppercase">
												Station
											</TableHead>
											<TableHead className="whitespace-nowrap text-slate-400 font-bold uppercase">
												Priority
											</TableHead>
											<TableHead className="whitespace-nowrap text-slate-400 font-bold uppercase">
												Reviewed By
											</TableHead>
											<TableHead className="whitespace-nowrap text-slate-400 font-bold uppercase">Date</TableHead>
											<TableHead className="whitespace-nowrap text-right text-slate-400 font-bold uppercase">
												Actions
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{requests.map((request) => (
											<TableRow key={request.id} className="border-b border-white/5 hover:bg-white/5">
												<TableCell className="whitespace-nowrap font-medium text-slate-300">
													<Link
														href={
															`/requests/${request.id}` as any
														}
														className="hover:underline text-red-400"
													>
														{request.id.substring(0, 8)}...
													</Link>
												</TableCell>
												<TableCell className="whitespace-nowrap uppercase text-slate-300">
													{request.station?.name || request.stationId}
												</TableCell>
												<TableCell className="whitespace-nowrap">
													<Badge
														variant={
															request.priority === "CRITICAL"
																? "destructive"
																: "outline"
														}
														className="rounded-none border-red-500/30 text-[9px] uppercase font-bold"
													>
														{request.priority}
													</Badge>
												</TableCell>
												<TableCell className="whitespace-nowrap uppercase text-slate-400">
													{request.reviewer?.name || "-"}
												</TableCell>
												<TableCell className="whitespace-nowrap text-slate-400">
													{new Date(request.createdAt).toLocaleDateString()}
												</TableCell>
												<TableCell className="flex justify-end gap-2">
													<Button className="h-8 rounded-none border border-foreground bg-slate-900 text-white font-bold text-[10px] uppercase shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] transition-all" asChild>
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
													: "cursor-pointer uppercase text-[10px] border border-white/10 rounded-none bg-slate-900"
											}
										/>
									</PaginationItem>
									<PaginationItem>
										<PaginationLink href="#" isActive className="rounded-none border border-white/20 bg-red-600 text-white font-bold text-[10px]">
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
													: "cursor-pointer uppercase text-[10px] border border-white/10 rounded-none bg-slate-900"
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
```

---

### Task 4: Redesign Regional Administrator Dashboard

Apply the monospace telemetry card grids to system administration parameters.

**File:**
- Modify: `apps/web/src/app/(authenticated)/dashboard/components/admin-dashboard.tsx`

**Implementation Details:**
Format all registration indicators and counter cards with high contrast and zero borders:

```tsx
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
			<div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
				<h2 className="font-bold text-lg uppercase tracking-wider text-white">
					{"/// SYSTEM ADMINISTRATION PORTAL"}
				</h2>
				<p className="text-red-400 text-[10px] uppercase">Welcome, {session.user.name} | root.active</p>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				<Card className="console-card crosshair-corner rounded-none border-white/10">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-bold text-[10px] text-slate-400 uppercase">TOTAL USERS</CardTitle>
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
						<p className="text-slate-500 text-[9px] uppercase tracking-wider mt-1">Active system users</p>
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
						<p className="text-slate-500 text-[9px] uppercase tracking-wider mt-1">
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
						<p className="text-slate-500 text-[9px] uppercase tracking-wider mt-1">
							All logistics requests
						</p>
					</CardContent>
				</Card>

				<Card className="console-card crosshair-corner rounded-none border-white/10">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-bold text-[10px] text-slate-400 uppercase">
							PENDING REQUESTS
						</CardTitle>
						<FileStack className="h-4 w-4 text-yellow-500 animate-pulse" />
					</CardHeader>
					<CardContent>
						<div className="font-black text-2xl text-yellow-500">
							{isLoading ? (
								<Skeleton className="h-8 w-12 bg-slate-800" />
							) : (
								stats?.pendingRequests || 0
							)}
						</div>
						<p className="text-yellow-400 text-[9px] uppercase tracking-wider mt-1">Awaiting approval</p>
					</CardContent>
				</Card>

				<Card className="console-card crosshair-corner rounded-none border-white/10">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-bold text-[10px] text-slate-400 uppercase">PROVINCES</CardTitle>
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
						<p className="text-slate-500 text-[9px] uppercase tracking-wider mt-1">Covered provinces</p>
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
						<p className="text-slate-500 text-[9px] uppercase tracking-wider mt-1">Consumable supplies</p>
					</CardContent>
				</Card>

				<Card className="console-card crosshair-corner rounded-none border-white/10">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-bold text-[10px] text-slate-400 uppercase">TOTAL ASSETS</CardTitle>
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
						<p className="text-slate-500 text-[9px] uppercase tracking-wider mt-1">
							Equipment and assets
						</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
```

---

### Task 5: Compilation Validation and Verification

Validate the full static generation and test execution after edits are made.

1. **Verify Vitest Suite:**
   Run: `npm run test -w web`
   Expected: 28/28 unit tests pass successfully.

2. **Verify Next.js Compilation:**
   Run: `npm run build -w web`
   Expected: Static output generated with zero TS configuration or inline CSS rules conflicts.
