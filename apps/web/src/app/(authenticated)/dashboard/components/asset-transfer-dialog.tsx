"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowRightLeft } from "lucide-react";
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
	DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { client } from "@/utils/orpc";

interface Asset {
	id: string;
	name: string;
	serialNumber: string | null;
	stationId: string;
}

export function AssetTransferDialog({
	assets,
	currentStationId,
}: {
	assets: Asset[];
	currentStationId: string;
}) {
	const [open, setOpen] = useState(false);
	const [selectedAssetId, setSelectedAssetId] = useState("");
	const [targetStationId, setTargetStationId] = useState("");
	const [remarks, setRemarks] = useState("");

	const { data: stations } = useQuery({
		queryKey: ["stations-list"],
		queryFn: async () => await client.inventory.listStations(),
	});

	const transferAsset = useMutation({
		mutationFn: async () => {
			if (!selectedAssetId || !targetStationId) return;
			await client.inventory.transferAsset({
				assetId: selectedAssetId,
				toStationId: targetStationId,
				remarks,
			});
		},
		onSuccess: () => {
			toast.success("Transfer initiated successfully");
			setOpen(false);
			setSelectedAssetId("");
			setTargetStationId("");
			setRemarks("");
		},
		onError: (err) => {
			toast.error(err.message || "Failed to initiate transfer");
		},
	});

	const filteredStations =
		stations?.filter((s) => s.id !== currentStationId) || [];
	const selectedAsset = assets.find((a) => a.id === selectedAssetId);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size="sm" className="gap-2">
					<ArrowRightLeft className="h-4 w-4" />
					Transfer Asset
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-xl">
				<DialogHeader>
					<DialogTitle className="text-xl">Initiate Asset Transfer</DialogTitle>
					<DialogDescription>
						Move an asset to another station. The receiving station commander
						must accept the transfer for it to complete.
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-6 py-4">
					<div className="grid gap-2">
						<Label htmlFor="asset-select" className="font-semibold text-sm">
							Select Asset
						</Label>
						<Select
							value={selectedAssetId}
							onValueChange={(val) => val && setSelectedAssetId(val)}
						>
							<SelectTrigger id="asset-select" className="h-11">
								<SelectValue>
									{selectedAsset ? (
										selectedAsset.name
									) : (
										<span className="text-muted-foreground">
											Select an asset from inventory...
										</span>
									)}
								</SelectValue>
							</SelectTrigger>
							<SelectContent>
								{assets.map((asset) => (
									<SelectItem key={asset.id} value={asset.id}>
										<div className="flex flex-col items-start gap-1 py-1">
											<span className="font-medium">{asset.name}</span>
											{asset.serialNumber && (
												<span className="text-muted-foreground text-xs">
													SN: {asset.serialNumber}
												</span>
											)}
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						{selectedAsset && (
							<div className="rounded-md border bg-muted/50 p-3 text-sm">
								<div className="grid grid-cols-2 gap-2">
									<div>
										<span className="text-muted-foreground text-xs">
											Serial Number
										</span>
										<p className="font-medium">
											{selectedAsset.serialNumber || "N/A"}
										</p>
									</div>
									<div>
										<span className="text-muted-foreground text-xs">
											Current ID
										</span>
										<p className="font-medium font-mono text-xs">
											{selectedAsset.id.substring(0, 8)}
										</p>
									</div>
								</div>
							</div>
						)}
					</div>

					<div className="grid gap-2">
						<Label
							htmlFor="destination-select"
							className="font-semibold text-sm"
						>
							Destination Station
						</Label>
						<Select
							value={targetStationId}
							onValueChange={(val) => val && setTargetStationId(val)}
						>
							<SelectTrigger
								id="destination-select"
								className="h-11"
								aria-label="Destination Station"
							>
								<SelectValue>
									{stations?.find((s) => s.id === targetStationId)?.name || (
										<span className="text-muted-foreground">
											Select destination station...
										</span>
									)}
								</SelectValue>
							</SelectTrigger>
							<SelectContent>
								{filteredStations.map((station) => (
									<SelectItem
										key={station.id}
										value={station.id}
										className="py-2"
									>
										{station.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="grid gap-2">
						<Label htmlFor="remarks" className="font-semibold text-sm">
							Remarks (Optional)
						</Label>
						<Textarea
							id="remarks"
							placeholder="Add context, reason for transfer, or instructions..."
							value={remarks}
							onChange={(e) => setRemarks(e.target.value)}
							className="min-h-[100px] resize-none"
						/>
					</div>
				</div>

				<DialogFooter className="gap-2 sm:gap-0">
					<Button variant="outline" onClick={() => setOpen(false)}>
						Cancel
					</Button>
					<Button
						onClick={() => transferAsset.mutate()}
						disabled={
							!selectedAssetId || !targetStationId || transferAsset.isPending
						}
					>
						{transferAsset.isPending ? "Initiating..." : "Confirm Transfer"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
