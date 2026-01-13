"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
	Activity,
	Calendar,
	Database,
	Eye,
	Filter,
	Loader2,
	ShieldCheck,
	User,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { client } from "@/utils/orpc";

const ITEMS_PER_PAGE = 15;

function getActionBadgeVariant(
	action: string,
): "default" | "secondary" | "destructive" | "outline" {
	if (action.includes("DELETE") || action.includes("REJECT"))
		return "destructive";
	if (action.includes("CREATE")) return "default";
	if (
		action.includes("UPDATE") ||
		action.includes("APPROVE") ||
		action.includes("VALIDATE")
	)
		return "secondary";
	return "outline";
}

function formatAction(action: string): string {
	return action.replace(/_/g, " ");
}

export default function AuditLogsPage() {
	const [currentPage, setCurrentPage] = useState(1);
	const [actionFilter, setActionFilter] = useState<string>("");
	const [entityFilter, setEntityFilter] = useState<string>("");

	const { data, isLoading } = useQuery({
		queryKey: ["audit", "list", currentPage, actionFilter, entityFilter],
		queryFn: () =>
			client.audit.list({
				page: currentPage,
				limit: ITEMS_PER_PAGE,
				action: actionFilter || undefined,
				entity: entityFilter || undefined,
			}),
	});

	const { data: actions } = useQuery({
		queryKey: ["audit", "getActions"],
		queryFn: () => client.audit.getActions(),
	});

	const { data: entities } = useQuery({
		queryKey: ["audit", "getEntities"],
		queryFn: () => client.audit.getEntities(),
	});

	const logs = data?.logs ?? [];
	const totalPages = data?.totalPages ?? 1;
	const total = data?.total ?? 0;

	const handleFilterChange = (type: "action" | "entity", value: string) => {
		if (type === "action") {
			setActionFilter(value === "all" ? "" : value);
		} else {
			setEntityFilter(value === "all" ? "" : value);
		}
		setCurrentPage(1);
	};

	const getPageNumbers = () => {
		const pages: (number | "ellipsis")[] = [];
		if (totalPages <= 7) {
			for (let i = 1; i <= totalPages; i++) pages.push(i);
		} else {
			pages.push(1);
			if (currentPage > 3) pages.push("ellipsis");
			for (
				let i = Math.max(2, currentPage - 1);
				i <= Math.min(totalPages - 1, currentPage + 1);
				i++
			) {
				pages.push(i);
			}
			if (currentPage < totalPages - 2) pages.push("ellipsis");
			pages.push(totalPages);
		}
		return pages;
	};

	return (
		<div className="mx-auto max-w-7xl space-y-6">
			{/* Header Section */}
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h2 className="flex items-center gap-2 font-bold text-3xl tracking-tight">
						<ShieldCheck className="h-8 w-8 text-primary" />
						Audit Logs
					</h2>
					<p className="mt-1 text-muted-foreground text-sm md:text-base">
						Comprehensive record of system activities, user actions, and
						critical events.
					</p>
				</div>
				<div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-1">
					<div className="flex items-center gap-2 px-2 font-medium text-muted-foreground text-sm">
						<Activity className="h-4 w-4" />
						<span>{total} Events Recorded</span>
					</div>
				</div>
			</div>

			<Separator />

			{/* Filters & Content */}
			<div className="grid gap-6">
				{/* Filter Bar */}
				<div className="flex flex-col items-start justify-between gap-4 rounded-lg border bg-card p-4 shadow-sm sm:flex-row sm:items-center">
					<div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
						<div className="w-full space-y-1 sm:w-56">
							<span className="ml-1 font-medium text-muted-foreground text-xs">
								Filter by Action
							</span>
							<Select
								value={actionFilter || "all"}
								onValueChange={(v) => handleFilterChange("action", v ?? "all")}
							>
								<SelectTrigger className="w-full bg-background">
									<div className="flex items-center gap-2">
										<Filter className="h-3.5 w-3.5 text-muted-foreground" />
										<SelectValue />
									</div>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Actions</SelectItem>
									{actions?.map((action) => (
										<SelectItem key={action} value={action}>
											{formatAction(action)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="w-full space-y-1 sm:w-56">
							<span className="ml-1 font-medium text-muted-foreground text-xs">
								Filter by Entity
							</span>
							<Select
								value={entityFilter || "all"}
								onValueChange={(v) => handleFilterChange("entity", v ?? "all")}
							>
								<SelectTrigger className="w-full bg-background">
									<div className="flex items-center gap-2">
										<Database className="h-3.5 w-3.5 text-muted-foreground" />
										<SelectValue />
									</div>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Entities</SelectItem>
									{entities?.map((entity) => (
										<SelectItem key={entity} value={entity}>
											{entity.charAt(0).toUpperCase() + entity.slice(1)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
					{/* Clear filters button could go here */}
				</div>

				{/* Main Table Card */}
				<Card className="overflow-hidden border-muted/60 shadow-md">
					<div className="overflow-x-auto">
						<Table>
							<TableHeader className="bg-muted/40">
								<TableRow>
									<TableHead className="w-[180px] whitespace-nowrap">
										Timestamp
									</TableHead>
									<TableHead className="w-[200px] whitespace-nowrap">
										User
									</TableHead>
									<TableHead className="w-[150px] whitespace-nowrap">
										Action
									</TableHead>
									<TableHead className="w-[150px] whitespace-nowrap">
										Entity
									</TableHead>
									<TableHead className="w-[150px] whitespace-nowrap">
										Entity ID
									</TableHead>
									<TableHead className="whitespace-nowrap text-right">
										Details
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{isLoading ? (
									<TableRow>
										<TableCell colSpan={6} className="h-32 text-center">
											<div className="flex flex-col items-center justify-center gap-2">
												<Loader2 className="h-8 w-8 animate-spin text-primary" />
												<span className="text-muted-foreground text-sm">
													Loading audit logs...
												</span>
											</div>
										</TableCell>
									</TableRow>
								) : logs.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={6}
											className="h-32 text-center text-muted-foreground"
										>
											No audit logs matching your filters.
										</TableCell>
									</TableRow>
								) : (
									logs.map((log) => (
										<TableRow
											key={log.id}
											className="transition-colors hover:bg-muted/30"
										>
											<TableCell>
												<div className="flex flex-col gap-0.5">
													<span className="font-medium text-sm">
														{format(new Date(log.createdAt), "MMM d, yyyy")}
													</span>
													<span className="flex items-center gap-1 text-muted-foreground text-xs">
														<Calendar className="h-3 w-3" />
														{format(new Date(log.createdAt), "HH:mm:ss")}
													</span>
												</div>
											</TableCell>
											<TableCell>
												<div className="flex flex-col gap-0.5">
													<div className="flex items-center gap-1.5 font-medium text-sm">
														<User className="h-3.5 w-3.5 text-muted-foreground" />
														{log.userName || "System / Unknown"}
													</div>
													<span className="pl-5 text-muted-foreground text-xs">
														{log.userEmail}
													</span>
												</div>
											</TableCell>
											<TableCell>
												<Badge
													variant={getActionBadgeVariant(log.action)}
													className="shadow-sm"
												>
													{formatAction(log.action)}
												</Badge>
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													<span className="font-medium text-sm capitalize">
														{log.entity}
													</span>
												</div>
											</TableCell>
											<TableCell>
												<code className="rounded bg-muted px-2 py-1 font-mono text-muted-foreground text-xs">
													{log.entityId.slice(0, 8)}...
												</code>
											</TableCell>
											<TableCell className="text-right">
												<Sheet>
													<SheetTrigger className="inline-flex h-8 w-8 items-center justify-center whitespace-nowrap rounded-md font-medium text-sm transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
														<Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
														<span className="sr-only">View Details</span>
													</SheetTrigger>
													<SheetContent className="w-[400px] sm:w-[540px]">
														<SheetHeader>
															<SheetTitle className="flex items-center gap-2">
																<ShieldCheck className="h-5 w-5" />
																Audit Log Details
															</SheetTitle>
															<SheetDescription>
																Event ID:{" "}
																<code className="text-xs">{log.id}</code>
															</SheetDescription>
														</SheetHeader>
														<Separator className="my-6" />
														<div className="space-y-6">
															<div className="grid grid-cols-2 gap-4">
																<div className="space-y-1">
																	<span className="font-medium text-muted-foreground text-xs">
																		Action Type
																	</span>
																	<div>
																		<Badge
																			variant={getActionBadgeVariant(
																				log.action,
																			)}
																		>
																			{formatAction(log.action)}
																		</Badge>
																	</div>
																</div>
																<div className="space-y-1">
																	<span className="font-medium text-muted-foreground text-xs">
																		Target Entity
																	</span>
																	<div className="flex items-center gap-2 font-medium capitalize">
																		<Database className="h-3.5 w-3.5 text-muted-foreground" />
																		{log.entity}
																	</div>
																</div>
																<div className="space-y-1">
																	<span className="font-medium text-muted-foreground text-xs">
																		Performed By
																	</span>
																	<div className="font-medium text-sm">
																		{log.userName}
																	</div>
																	<div className="text-muted-foreground text-xs">
																		{log.userEmail}
																	</div>
																</div>
																<div className="space-y-1">
																	<span className="font-medium text-muted-foreground text-xs">
																		Date & Time
																	</span>
																	<div className="text-sm">
																		{format(new Date(log.createdAt), "PPpp")}
																	</div>
																</div>
															</div>

															<div className="space-y-2">
																<span className="font-medium text-muted-foreground text-xs">
																	Change Details (JSON)
																</span>
																<div className="rounded-md border bg-muted/50 p-4 font-mono text-xs">
																	<ScrollArea className="h-[200px] w-full">
																		<pre>
																			{JSON.stringify(log.details, null, 2)}
																		</pre>
																	</ScrollArea>
																</div>
															</div>
														</div>
													</SheetContent>
												</Sheet>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>
				</Card>

				{/* Pagination */}
				{totalPages > 1 && (
					<div className="flex items-center justify-end px-2">
						<Pagination>
							<PaginationContent>
								<PaginationItem>
									<PaginationPrevious
										onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
										className={
											currentPage === 1
												? "pointer-events-none opacity-50"
												: "cursor-pointer"
										}
									/>
								</PaginationItem>
								{getPageNumbers().map((page, idx) => (
									<PaginationItem
										key={page === "ellipsis" ? `ellipsis-${idx}` : page}
									>
										{page === "ellipsis" ? (
											<span className="px-2">...</span>
										) : (
											<PaginationLink
												onClick={() => setCurrentPage(page)}
												isActive={currentPage === page}
												className="cursor-pointer"
											>
												{page}
											</PaginationLink>
										)}
									</PaginationItem>
								))}
								<PaginationItem>
									<PaginationNext
										onClick={() =>
											setCurrentPage((p) => Math.min(totalPages, p + 1))
										}
										className={
											currentPage === totalPages
												? "pointer-events-none opacity-50"
												: "cursor-pointer"
										}
									/>
								</PaginationItem>
							</PaginationContent>
						</Pagination>
					</div>
				)}
			</div>
		</div>
	);
}
