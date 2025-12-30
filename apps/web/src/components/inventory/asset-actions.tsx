"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { client } from "@/utils/orpc";

interface AssetActionsProps {
	// biome-ignore lint/suspicious/noExplicitAny: generic asset type
	item: any;
}

export function AssetActions({ item }: AssetActionsProps) {
	const queryClient = useQueryClient();
	const [statusDialogOpen, setStatusDialogOpen] = useState(false);
	const [selectedStatus, setSelectedStatus] = useState<string>(
		item.status || "GOOD",
	);

	const updateStatus = useMutation({
		mutationFn: (data: {
			assetId: string;
			status: "GOOD" | "REPAIR" | "DISPOSED" | "LOST";
		}) => client.inventory.updateAssetStatus(data),
		onSuccess: () => {
			toast.success("Asset status updated");
			queryClient.invalidateQueries({ queryKey: ["inventory"] });
			setStatusDialogOpen(false);
		},
		onError: (error: Error) => {
			toast.error("Failed to update status", {
				description: error.message,
			});
		},
	});

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md p-0 hover:bg-muted data-[state=open]:bg-muted">
					<span className="sr-only">Open menu</span>
					<MoreHorizontal className="h-4 w-4" />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuGroup>
						<DropdownMenuLabel>Actions</DropdownMenuLabel>
						<DropdownMenuItem onClick={() => setStatusDialogOpen(true)}>
							<RefreshCw className="mr-2 h-4 w-4" />
							Update Status
						</DropdownMenuItem>
					</DropdownMenuGroup>
					{/* Add Transfer action here later */}
				</DropdownMenuContent>
			</DropdownMenu>

			<Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Confirm Status Update</DialogTitle>
						<DialogDescription>
							Select the new status for this asset. This action will be logged.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="space-y-2">
							<Label>New Status</Label>
							<Select
								value={selectedStatus}
								onValueChange={(val) => {
									if (val) setSelectedStatus(val);
								}}
							>
								<SelectTrigger>
									<SelectValue>{selectedStatus}</SelectValue>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="GOOD">Good (Functional)</SelectItem>
									<SelectItem value="REPAIR">For Repair</SelectItem>
									<SelectItem value="DISPOSED">Disposed (Unusable)</SelectItem>
									<SelectItem value="LOST">Lost / Missing</SelectItem>
								</SelectContent>
							</Select>
						</div>
						{(selectedStatus === "DISPOSED" || selectedStatus === "LOST") && (
							<div className="rounded-md bg-destructive/15 p-3 text-destructive text-sm">
								Warning: Marking an asset as {selectedStatus} may remove it from
								active inventory counts.
							</div>
						)}
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setStatusDialogOpen(false)}
							disabled={updateStatus.isPending}
						>
							Cancel
						</Button>
						<Button
							variant={
								selectedStatus === "DISPOSED" || selectedStatus === "LOST"
									? "destructive"
									: "default"
							}
							onClick={() =>
								updateStatus.mutate({
									assetId: item.id,
									status: selectedStatus as
										| "GOOD"
										| "REPAIR"
										| "DISPOSED"
										| "LOST",
								})
							}
							disabled={
								updateStatus.isPending || selectedStatus === item.status
							}
						>
							{updateStatus.isPending ? "Updating..." : "Confirm Update"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
