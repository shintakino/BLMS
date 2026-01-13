"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, Eye, Paperclip } from "lucide-react";
import { useRouter } from "next/navigation";
import { use } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { client } from "@/utils/orpc";

import RequestActions from "./components/request-actions";

export default function RequestDetailsPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = use(params);
	const router = useRouter();
	const { data: session } = authClient.useSession();
	const {
		data: request,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["request", id],
		queryFn: async () => await client.logistics.get({ id }),
		staleTime: 1000 * 60 * 5, // 5 minutes
	});

	if (isLoading) {
		return <div className="p-8 text-center">Loading request details...</div>;
	}

	if (error || !request) {
		return (
			<div className="p-8 text-center text-red-500">
				Failed to load request. It may not exist or you don't have permission.
			</div>
		);
	}

	return (
		<div className="container mx-auto space-y-8 px-4 py-10">
			<div>
				<Button
					variant="ghost"
					className="mb-4 pl-0 hover:bg-transparent hover:text-slate-600 dark:hover:text-slate-300"
					onClick={() => router.back()}
				>
					<ArrowLeft className="mr-2 h-4 w-4" />
					Back
				</Button>
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div>
						<h1 className="font-bold text-3xl tracking-tight">
							Request #{id.substring(0, 8)}
						</h1>
						<div className="mt-2 flex items-center gap-3">
							<Badge
								variant={
									request.priority === "CRITICAL" ? "destructive" : "secondary"
								}
							>
								{request.priority} Priority
							</Badge>
							<Badge variant="outline">{request.status}</Badge>
						</div>
					</div>

					<RequestActions
						requestId={id}
						currentStatus={request.status}
						// biome-ignore lint/suspicious/noExplicitAny: types are broken for session user role
						userRole={(session?.user as any).role || ""}
					/>
				</div>
			</div>

			<div className="grid gap-6 md:grid-cols-3">
				<div className="space-y-6 md:col-span-2">
					<Card>
						<CardHeader>
							<CardTitle>Justification</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-slate-600 dark:text-slate-300">
								{request.justification || "No justification provided."}
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Items Requested</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="relative overflow-x-auto">
								<table className="w-full text-left text-sm">
									<thead className="bg-slate-100 text-xs uppercase dark:bg-slate-800">
										<tr>
											<th className="whitespace-nowrap px-4 py-2">Item Name</th>
											<th className="whitespace-nowrap px-4 py-2">Category</th>
											<th className="whitespace-nowrap px-4 py-2">Quantity</th>
										</tr>
									</thead>
									<tbody>
										{request.items.map((item) => (
											<tr key={item.id} className="border-b">
												<td className="px-4 py-3 font-medium">
													{item.itemName}
												</td>
												<td className="px-4 py-3">{item.category}</td>
												<td className="px-4 py-3">{item.quantity}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Attachments</CardTitle>
						</CardHeader>
						<CardContent>
							{request.attachments.length === 0 ? (
								<p className="text-slate-500 text-sm">No attachments.</p>
							) : (
								<div className="grid gap-2 sm:grid-cols-2">
									{request.attachments.map((att) => (
										<div
											key={att.id}
											className="flex items-center gap-3 rounded-lg border p-3"
										>
											<div className="flex h-10 w-10 items-center justify-center rounded bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
												<Paperclip className="h-5 w-5" />
											</div>
											<div className="flex-1 overflow-hidden">
												<p className="truncate font-medium text-sm">
													{att.fileName}
												</p>
												<p className="text-slate-500 text-xs uppercase">
													{att.fileType.split("/")[1] || "FILE"}
												</p>
											</div>
											<div className="flex gap-1">
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8"
													asChild
												>
													<a
														href={att.fileUrl}
														target="_blank"
														rel="noopener noreferrer"
														title="View"
													>
														<Eye className="h-4 w-4" />
													</a>
												</Button>
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8"
													asChild
												>
													<a
														href={att.downloadUrl || att.fileUrl}
														download={att.fileName}
														title="Download"
													>
														<Download className="h-4 w-4" />
													</a>
												</Button>
											</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</div>

				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Timeline</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="ml-2 space-y-4 border-slate-200 border-l-2 pl-4">
								<div className="relative">
									<div className="absolute top-1 -left-[21px] h-3 w-3 rounded-full bg-slate-300" />
									<p className="font-medium text-sm">Request Created</p>
									<p className="text-muted-foreground text-xs">
										{new Date(request.createdAt).toLocaleDateString()}
									</p>
									<p className="text-muted-foreground text-xs">
										by {request.creator?.name || request.createdBy}
									</p>
								</div>

								{request.approvals.map((approval) => (
									<div key={approval.id} className="relative">
										<div
											className={`absolute top-1 -left-[21px] h-3 w-3 rounded-full ${
												approval.action.includes("REJECT")
													? "bg-red-500"
													: "bg-blue-500"
											}`}
										/>
										<p className="font-medium text-sm capitalize">
											{approval.action.replace("_", " ").toLowerCase()}
										</p>
										<p className="text-muted-foreground text-xs">
											{new Date(approval.createdAt).toLocaleDateString()}
										</p>
										<p className="text-muted-foreground text-xs">
											by {approval.user.name} ({approval.role})
										</p>
										{approval.remarks && (
											<p className="mt-1 font-medium text-slate-500 text-xs italic">
												"{approval.remarks}"
											</p>
										)}
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
