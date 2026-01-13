import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	Clock,
	Edit,
	Eye,
	FileText,
	MoreHorizontal,
	Package,
	Plus,
	Send,
	Trash2,
	X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { client } from "@/utils/orpc";

function RequestActionMenu({
	request,
}: {
	request: { id: string; status: string };
}) {
	const _router = useRouter();
	const queryClient = useQueryClient();
	const [activeAlert, setActiveAlert] = useState<
		"DELETE" | "SUBMIT" | "CANCEL" | null
	>(null);

	const deleteRequest = useMutation({
		mutationFn: (data: { requestId: string }) => client.logistics.delete(data),
		onSuccess: () => {
			toast.success(
				request.status === "DRAFT" ? "Request deleted" : "Request cancelled",
			);
			queryClient.invalidateQueries({ queryKey: ["requests"] });
			queryClient.invalidateQueries({ queryKey: ["requests-stats"] });
		},
		onError: (err) => {
			toast.error(err.message);
		},
	});

	const submitRequest = useMutation({
		mutationFn: (data: { requestId: string }) => client.logistics.submit(data),
		onSuccess: () => {
			toast.success("Request submitted");
			queryClient.invalidateQueries({ queryKey: ["requests"] });
			queryClient.invalidateQueries({ queryKey: ["requests-stats"] });
		},
		onError: (err) => {
			toast.error(err.message);
		},
	});

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger
					className="inline-flex h-8 w-8 items-center justify-center rounded-md p-0 hover:bg-muted data-[state=open]:bg-muted"
					onMouseEnter={() => {
						queryClient.prefetchQuery({
							queryKey: ["request", request.id],
							queryFn: async () =>
								await client.logistics.get({ id: request.id }),
							staleTime: 1000 * 60 * 5, // 5 minutes
						});
					}}
				>
					<span className="sr-only">Open menu</span>
					<MoreHorizontal className="h-4 w-4" />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuGroup>
						<DropdownMenuLabel>Actions</DropdownMenuLabel>
						<DropdownMenuItem asChild>
							<Link
								href={`/requests/${request.id}`}
								className="flex w-full cursor-pointer items-center"
							>
								<Eye className="mr-2 h-4 w-4" />
								View Details
							</Link>
						</DropdownMenuItem>
						{request.status === "DRAFT" && (
							<>
								<DropdownMenuItem asChild>
									<Link
										href={`/requests/${request.id}/edit`}
										className="flex w-full cursor-pointer items-center text-blue-600 focus:bg-blue-50 focus:text-blue-700"
									>
										<Edit className="mr-2 h-4 w-4" />
										Edit
									</Link>
								</DropdownMenuItem>
								<DropdownMenuItem
									className="cursor-pointer text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700"
									onClick={() => setActiveAlert("SUBMIT")}
								>
									<Send className="mr-2 h-4 w-4" />
									Submit
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700"
									onClick={() => setActiveAlert("DELETE")}
								>
									<Trash2 className="mr-2 h-4 w-4" />
									Delete
								</DropdownMenuItem>
							</>
						)}
						{request.status === "SUBMITTED" && (
							<>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									className="cursor-pointer text-orange-600 focus:bg-orange-50 focus:text-orange-700"
									onClick={() => setActiveAlert("CANCEL")}
								>
									<X className="mr-2 h-4 w-4" />
									Cancel Request
								</DropdownMenuItem>
							</>
						)}
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>

			<AlertDialog
				open={activeAlert !== null}
				onOpenChange={(open) => !open && setActiveAlert(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{activeAlert === "SUBMIT"
								? "Submit Request?"
								: activeAlert === "DELETE"
									? "Delete Draft?"
									: "Cancel Request?"}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{activeAlert === "SUBMIT"
								? "This will submit the request for approval. You cannot edit it afterwards."
								: activeAlert === "DELETE"
									? "This will permanently delete this draft. This action cannot be undone."
									: "This will permanently cancel and remove this submitted request."}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							className={
								activeAlert === "DELETE" || activeAlert === "CANCEL"
									? "bg-red-600 hover:bg-red-700"
									: "bg-blue-600 hover:bg-blue-700"
							}
							onClick={() => {
								if (activeAlert === "SUBMIT") {
									submitRequest.mutate({ requestId: request.id });
								} else {
									deleteRequest.mutate({ requestId: request.id });
								}
								setActiveAlert(null);
							}}
						>
							{activeAlert === "SUBMIT" ? "Submit" : "Delete"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}

export default function SupplyOfficerDashboard() {
	const [page, setPage] = useState(1);
	const limit = 5;
	const queryClient = useQueryClient();
	const { data: stats, isLoading: statsLoading } = useQuery({
		queryKey: ["requests-stats", "supply-officer"],
		queryFn: async () => await client.logistics.getStats(),
	});
	const { data: recentRequests, isLoading: requestsLoading } = useQuery({
		queryKey: ["requests", "supply-officer", "recent", page],
		queryFn: async () =>
			await client.logistics.list({ limit, offset: (page - 1) * limit }),
	});

	React.useEffect(() => {
		if (recentRequests) {
			for (const request of recentRequests) {
				queryClient.prefetchQuery({
					queryKey: ["request", request.id],
					queryFn: async () => await client.logistics.get({ id: request.id }),
					staleTime: 1000 * 60 * 5, // 5 minutes
				});
			}
		}
	}, [recentRequests, queryClient]);

	if (statsLoading || requestsLoading) {
		return <div>Loading dashboard...</div>;
	}

	const pendingCount = stats?.pending || 0;
	const draftCount = stats?.draft || 0;
	const approvedCount = stats?.approved || 0;

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<h2 className="font-bold text-3xl tracking-tight">Station Logistics</h2>
				{/* biome-ignore lint/suspicious/noExplicitAny: types are broken for Link href */}
				<Link href={"/requests/new" as any}>
					<Button className="bg-red-600 hover:bg-red-700">
						<Plus className="mr-2 h-4 w-4" />
						Create Request
					</Button>
				</Link>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Pending Requests
						</CardTitle>
						<Clock className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{pendingCount}</div>
						<p className="text-muted-foreground text-xs">
							Requests awaiting approval
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Draft Requests
						</CardTitle>
						<FileText className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{draftCount}</div>
						<p className="text-muted-foreground text-xs">Not yet submitted</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Completed Requests
						</CardTitle>
						<Package className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{approvedCount}</div>
						<p className="text-muted-foreground text-xs">
							Fully approved & delivered
						</p>
					</CardContent>
				</Card>
			</div>

			<div className="space-y-4">
				<h3 className="font-semibold text-xl">Recent Requests</h3>
				<Card>
					<CardContent className="p-0">
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="whitespace-nowrap">ID</TableHead>
										<TableHead className="whitespace-nowrap">Status</TableHead>
										<TableHead className="whitespace-nowrap">
											Priority
										</TableHead>
										<TableHead className="whitespace-nowrap">
											Date Created
										</TableHead>
										<TableHead className="whitespace-nowrap text-right">
											Action
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{recentRequests?.map((request) => (
										<TableRow key={request.id}>
											<TableCell className="whitespace-nowrap font-mono text-xs">
												{request.id.slice(0, 8)}
											</TableCell>
											<TableCell className="whitespace-nowrap">
												<Badge
													variant={
														request.status === "APPROVED"
															? "default"
															: request.status === "REJECTED"
																? "destructive"
																: "secondary"
													}
												>
													{request.status}
												</Badge>
											</TableCell>
											<TableCell className="whitespace-nowrap">
												<Badge variant="outline">{request.priority}</Badge>
											</TableCell>
											<TableCell className="whitespace-nowrap">
												{new Date(request.createdAt).toLocaleDateString()}
											</TableCell>
											<TableCell className="text-right">
												<RequestActionMenu request={request} />
											</TableCell>
										</TableRow>
									))}
									{(!recentRequests || recentRequests.length === 0) && (
										<TableRow>
											<TableCell
												colSpan={5}
												className="py-6 text-center text-muted-foreground"
											>
												No requests found. Create one to get started.
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>
						</div>
					</CardContent>
				</Card>

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
									// Simple next check: if we got full page, assume there might be more
									if (recentRequests && recentRequests.length === limit)
										setPage(page + 1);
								}}
								className={
									!recentRequests || recentRequests.length < limit
										? "pointer-events-none opacity-50"
										: "cursor-pointer"
								}
							/>
						</PaginationItem>
					</PaginationContent>
				</Pagination>
			</div>
		</div>
	);
}
