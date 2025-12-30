"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckSquare, ClipboardList } from "lucide-react";
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

export default function RLMDashboard({
	session,
}: {
	session: typeof authClient.$Infer.Session;
}) {
	// Fetch requests ready for consolidation/review (VALIDATED status)
	const { data: requests, isLoading } = useQuery({
		queryKey: ["requests", "rlm", "validated"],
		queryFn: async () => {
			// RLM needs to see VALIDATED requests from stations in their region.
			// Currently assuming all VALIDATED requests for MVP.
			const allC = await client.logistics.list({ status: "VALIDATED" });
			return allC;
		},
	});

	const reviewCount = requests?.length || 0;

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
						<div className="font-bold text-2xl">-</div>
						<p className="text-muted-foreground text-xs">
							Requests consolidated this month
						</p>
					</CardContent>
				</Card>
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
