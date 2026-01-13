"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authClient } from "@/lib/auth-client";
import { client } from "@/utils/orpc";
import { AssetTransferDialog } from "../dashboard/components/asset-transfer-dialog";

export default function TransfersPage() {
	const { data: session } = authClient.useSession();
	const queryClient = useQueryClient();

	const [incomingPage, setIncomingPage] = useState(1);
	const [outgoingPage, setOutgoingPage] = useState(1);
	const ITEMS_PER_PAGE = 10;

	const { data: transfers } = useQuery({
		queryKey: ["transfers"],
		queryFn: async () => await client.inventory.listTransfers(),
	});

	const { data: inventoryData } = useQuery({
		queryKey: ["inventory", "station-commander"],
		queryFn: async () => await client.inventory.list({}),
	});

	const completeTransfer = useMutation({
		mutationFn: async (data: {
			transferId: string;
			action: "COMPLETE" | "CANCEL";
		}) => {
			await client.inventory.completeTransfer(data);
		},
		onSuccess: () => {
			toast.success("Transfer updated successfully");
			queryClient.invalidateQueries({ queryKey: ["transfers"] });
			queryClient.invalidateQueries({ queryKey: ["inventory"] }); // Update inventory counts
		},
		onError: (err) => {
			toast.error(err.message || "Action failed");
		},
	});

	// Cast session to access stationId
	// biome-ignore lint/suspicious/noExplicitAny: session user type needs extension
	const userStationId = (session?.user as any)?.stationId;

	if (!session) return <div>Loading session...</div>;

	const incomingTransfers =
		transfers?.filter((t) => t.toStationId === userStationId) || [];
	const outgoingTransfers =
		transfers?.filter((t) => t.fromStationId === userStationId) || [];

	const incomingTotalPages = Math.ceil(
		incomingTransfers.length / ITEMS_PER_PAGE,
	);
	const incomingPaginated = incomingTransfers.slice(
		(incomingPage - 1) * ITEMS_PER_PAGE,
		incomingPage * ITEMS_PER_PAGE,
	);

	const outgoingTotalPages = Math.ceil(
		outgoingTransfers.length / ITEMS_PER_PAGE,
	);
	const outgoingPaginated = outgoingTransfers.slice(
		(outgoingPage - 1) * ITEMS_PER_PAGE,
		outgoingPage * ITEMS_PER_PAGE,
	);

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" asChild>
						<Link href="/dashboard">
							<ArrowLeft className="h-4 w-4" />
						</Link>
					</Button>
					<h2 className="font-bold text-3xl tracking-tight">Asset Transfers</h2>
				</div>
				<div className="">
					{inventoryData && (
						<AssetTransferDialog
							assets={inventoryData.assets}
							// biome-ignore lint/suspicious/noExplicitAny: user type doesn't explicitly have stationId yet
							currentStationId={(session.user as any).stationId || ""}
						/>
					)}
				</div>
			</div>

			<Tabs defaultValue="incoming">
				<div className="overflow-x-auto pb-1">
					<TabsList>
						<TabsTrigger value="incoming">
							Incoming ({incomingTransfers.length})
						</TabsTrigger>
						<TabsTrigger value="outgoing">
							Outgoing ({outgoingTransfers.length})
						</TabsTrigger>
					</TabsList>
				</div>
				<TabsContent value="incoming">
					<Card>
						<CardHeader>
							<CardTitle>Incoming Transfers</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="whitespace-nowrap">Asset</TableHead>
											<TableHead className="whitespace-nowrap">From</TableHead>
											<TableHead className="whitespace-nowrap">Date</TableHead>
											<TableHead className="whitespace-nowrap">
												Status
											</TableHead>
											<TableHead className="whitespace-nowrap">
												Remarks
											</TableHead>
											<TableHead className="whitespace-nowrap text-right">
												Actions
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{incomingPaginated.length === 0 ? (
											<TableRow>
												<TableCell
													colSpan={6}
													className="text-center text-muted-foreground"
												>
													No incoming transfers.
												</TableCell>
											</TableRow>
										) : (
											incomingPaginated.map((t) => (
												<TableRow key={t.id}>
													<TableCell className="whitespace-nowrap">
														<div className="font-medium">{t.asset.name}</div>
														<div className="text-muted-foreground text-xs">
															{t.asset.serialNumber || "No Serial"}
														</div>
													</TableCell>
													<TableCell className="whitespace-nowrap">
														{t.fromStation.name}
													</TableCell>
													<TableCell className="whitespace-nowrap">
														{new Date(t.createdAt).toLocaleDateString()}
													</TableCell>
													<TableCell className="whitespace-nowrap">
														<Badge
															variant={
																t.status === "PENDING"
																	? "secondary"
																	: t.status === "COMPLETED"
																		? "default"
																		: "destructive"
															}
														>
															{t.status}
														</Badge>
													</TableCell>
													<TableCell className="max-w-[200px] truncate whitespace-nowrap">
														{t.remarks || "-"}
													</TableCell>
													<TableCell className="whitespace-nowrap text-right">
														{t.status === "PENDING" && (
															<div className="flex justify-end gap-2">
																<Button
																	size="sm"
																	variant="default"
																	className="bg-green-600 hover:bg-green-700"
																	onClick={() =>
																		completeTransfer.mutate({
																			transferId: t.id,
																			action: "COMPLETE",
																		})
																	}
																	disabled={completeTransfer.isPending}
																>
																	<Check className="mr-2 h-4 w-4" /> Accept
																</Button>
																<Button
																	size="sm"
																	variant="destructive"
																	onClick={() =>
																		completeTransfer.mutate({
																			transferId: t.id,
																			action: "CANCEL",
																		})
																	}
																	disabled={completeTransfer.isPending}
																>
																	<X className="mr-2 h-4 w-4" /> Reject
																</Button>
															</div>
														)}
													</TableCell>
												</TableRow>
											))
										)}
									</TableBody>
								</Table>
							</div>
							{incomingTotalPages > 1 && (
								<div className="mt-4">
									<Pagination>
										<PaginationContent>
											<PaginationItem>
												<PaginationPrevious
													href="#"
													onClick={(e) => {
														e.preventDefault();
														if (incomingPage > 1)
															setIncomingPage(incomingPage - 1);
													}}
													className={
														incomingPage === 1
															? "pointer-events-none opacity-50"
															: "cursor-pointer"
													}
												/>
											</PaginationItem>
											<PaginationItem>
												<PaginationLink href="#" isActive>
													{incomingPage}
												</PaginationLink>
											</PaginationItem>
											<PaginationItem>
												<PaginationNext
													href="#"
													onClick={(e) => {
														e.preventDefault();
														if (incomingPage < incomingTotalPages)
															setIncomingPage(incomingPage + 1);
													}}
													className={
														incomingPage === incomingTotalPages
															? "pointer-events-none opacity-50"
															: "cursor-pointer"
													}
												/>
											</PaginationItem>
										</PaginationContent>
									</Pagination>
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>
				<TabsContent value="outgoing">
					<Card>
						<CardHeader>
							<CardTitle>Outgoing Transfers</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="whitespace-nowrap">Asset</TableHead>
											<TableHead className="whitespace-nowrap">To</TableHead>
											<TableHead className="whitespace-nowrap">Date</TableHead>
											<TableHead className="whitespace-nowrap">
												Status
											</TableHead>
											<TableHead className="whitespace-nowrap">
												Remarks
											</TableHead>
											<TableHead className="whitespace-nowrap text-right">
												Actions
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{outgoingPaginated.length === 0 ? (
											<TableRow>
												<TableCell
													colSpan={6}
													className="text-center text-muted-foreground"
												>
													No outgoing transfers.
												</TableCell>
											</TableRow>
										) : (
											outgoingPaginated.map((t) => (
												<TableRow key={t.id}>
													<TableCell>
														<div className="font-medium">{t.asset.name}</div>
														<div className="text-muted-foreground text-xs">
															{t.asset.serialNumber || "No Serial"}
														</div>
													</TableCell>
													<TableCell>{t.toStation.name}</TableCell>
													<TableCell>
														{new Date(t.createdAt).toLocaleDateString()}
													</TableCell>
													<TableCell>
														<Badge
															variant={
																t.status === "PENDING"
																	? "secondary"
																	: t.status === "COMPLETED"
																		? "default"
																		: "destructive"
															}
														>
															{t.status}
														</Badge>
													</TableCell>
													<TableCell className="max-w-[200px] truncate">
														{t.remarks || "-"}
													</TableCell>
													<TableCell className="text-right">
														{t.status === "PENDING" && (
															<Button
																size="sm"
																variant="destructive"
																onClick={() =>
																	completeTransfer.mutate({
																		transferId: t.id,
																		action: "CANCEL",
																	})
																}
																disabled={completeTransfer.isPending}
															>
																<X className="mr-2 h-4 w-4" /> Cancel
															</Button>
														)}
													</TableCell>
												</TableRow>
											))
										)}
									</TableBody>
								</Table>
							</div>
							{outgoingTotalPages > 1 && (
								<div className="mt-4">
									<Pagination>
										<PaginationContent>
											<PaginationItem>
												<PaginationPrevious
													href="#"
													onClick={(e) => {
														e.preventDefault();
														if (outgoingPage > 1)
															setOutgoingPage(outgoingPage - 1);
													}}
													className={
														outgoingPage === 1
															? "pointer-events-none opacity-50"
															: "cursor-pointer"
													}
												/>
											</PaginationItem>
											<PaginationItem>
												<PaginationLink href="#" isActive>
													{outgoingPage}
												</PaginationLink>
											</PaginationItem>
											<PaginationItem>
												<PaginationNext
													href="#"
													onClick={(e) => {
														e.preventDefault();
														if (outgoingPage < outgoingTotalPages)
															setOutgoingPage(outgoingPage + 1);
													}}
													className={
														outgoingPage === outgoingTotalPages
															? "pointer-events-none opacity-50"
															: "cursor-pointer"
													}
												/>
											</PaginationItem>
										</PaginationContent>
									</Pagination>
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
