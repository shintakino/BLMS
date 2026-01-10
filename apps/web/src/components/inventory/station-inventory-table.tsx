"use client";

import { useState } from "react";
import { AddAssetDialog } from "@/components/inventory/add-asset-dialog";
import { AddItemDialog } from "@/components/inventory/add-item-dialog";
import { AdjustStockDialog } from "@/components/inventory/adjust-stock-dialog";
import { AssetActions } from "@/components/inventory/asset-actions";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

interface InventoryItem {
	id: string;
	itemName: string;
	type: string;
	category?: string;
	quantity: number;
	unit?: string;
	status?: string;
	stationName?: string;
}

interface InventorySourceItem {
	id: string;
	itemName: string;
	category: string;
	quantity: number;
	unit: string | null;
	station?: { name: string };
}

interface AssetSourceItem {
	id: string;
	name: string;
	category: string;
	status: "GOOD" | "REPAIR" | "DISPOSED" | "LOST";
	station?: { name: string };
}

interface StationData {
	inventory: InventorySourceItem[];
	assets: AssetSourceItem[];
}

export function StationInventoryTable({
	data,
	title = "Station Inventory",
	readOnly = false,
}: {
	data: StationData;
	title?: string;
	readOnly?: boolean;
}) {
	// Flatten data for table (Single Station)
	const inventoryItems = data.inventory.map((item) => ({
		...item,
		type: "Supply",
		unit: item.unit || undefined,
	}));

	const assets = data.assets.map((item) => ({
		...item,
		quantity: 1,
		itemName: item.name,
		unit: "unit",
		type: "Asset",
	}));

	const [filter, setFilter] = useState("");
	const [page, setPage] = useState(1);
	const ITEMS_PER_PAGE = 10;

	const allItems = [...inventoryItems, ...assets].filter(
		(item) =>
			item.itemName.toLowerCase().includes(filter.toLowerCase()) ||
			item.category?.toLowerCase().includes(filter.toLowerCase()) ||
			item.type.toLowerCase().includes(filter.toLowerCase()),
	);

	const totalPages = Math.ceil(allItems.length / ITEMS_PER_PAGE);
	const paginatedItems = allItems.slice(
		(page - 1) * ITEMS_PER_PAGE,
		page * ITEMS_PER_PAGE,
	);

	// Reset page when filter changes
	if (page > 1 && paginatedItems.length === 0 && totalPages > 0) {
		setPage(1);
	}

	return (
		<Card>
			<CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="space-y-1">
					<CardTitle>{title}</CardTitle>
					<CardDescription>
						{readOnly
							? "View assets and supplies for this station."
							: "Manage your station's assets and supplies."}
					</CardDescription>
				</div>
				<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
					<Input
						placeholder="Search items..."
						value={filter}
						onChange={(e) => {
							setFilter(e.target.value);
							setPage(1);
						}}
						className="w-full sm:w-[200px]"
					/>
					{!readOnly && (
						<div className="flex items-center gap-2">
							<AddItemDialog />
							<AddAssetDialog />
						</div>
					)}
				</div>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Item Name</TableHead>
							<TableHead>Type</TableHead>
							<TableHead>Category</TableHead>
							<TableHead>Quantity</TableHead>
							<TableHead>Assets Status</TableHead>
							{!readOnly && (
								<TableHead className="text-right">Actions</TableHead>
							)}
						</TableRow>
					</TableHeader>
					<TableBody>
						{paginatedItems.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={readOnly ? 5 : 6}
									className="p-8 text-center text-muted-foreground"
								>
									No items found.
								</TableCell>
							</TableRow>
						) : (
							paginatedItems.map((item: InventoryItem) => (
								<TableRow key={item.id}>
									<TableCell className="font-medium">{item.itemName}</TableCell>
									<TableCell>
										<Badge
											variant={item.type === "Asset" ? "secondary" : "outline"}
										>
											{item.type}
										</Badge>
									</TableCell>
									<TableCell>{item.category}</TableCell>
									<TableCell>
										{item.quantity} {item.unit}
									</TableCell>
									<TableCell>{item.status || "Good"}</TableCell>
									{!readOnly && (
										<TableCell className="text-right">
											{item.type === "Supply" && (
												<AdjustStockDialog item={item} />
											)}
											{item.type === "Asset" && <AssetActions item={item} />}
										</TableCell>
									)}
								</TableRow>
							))
						)}
					</TableBody>
				</Table>

				{totalPages > 1 && (
					<div className="mt-4 flex justify-center">
						<Pagination>
							<PaginationContent>
								<PaginationItem>
									<PaginationPrevious
										className={
											page === 1
												? "pointer-events-none opacity-50"
												: "cursor-pointer"
										}
										onClick={() => setPage((p) => Math.max(1, p - 1))}
									/>
								</PaginationItem>
								<PaginationItem>
									<PaginationLink>{page}</PaginationLink>
								</PaginationItem>
								<PaginationItem>
									<PaginationNext
										className={
											page === totalPages
												? "pointer-events-none opacity-50"
												: "cursor-pointer"
										}
										onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
									/>
								</PaginationItem>
							</PaginationContent>
						</Pagination>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
