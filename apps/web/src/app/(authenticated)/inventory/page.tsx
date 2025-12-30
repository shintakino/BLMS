"use client";

import { useQuery } from "@tanstack/react-query";

import { Loader2 } from "lucide-react";
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
import { authClient } from "@/lib/auth-client";
import { client } from "@/utils/orpc";
// We will retrieve user role from client-side session or assume it's passed/available contextually
// For this page, we might need to fetch the session client side if not passed as prop,
// strictly speaking app router pages are server components by default, but we are using "use client" for interactivity.
// We can use the useSession hook if needed, or pass it from layout.
// For now, let's assume we can determine mode based on API success/failure or role check if we had it.
// Simpler: Fetch using `list` first. If it fails (rare if RBAC works), try `listAll`.
// Better: Check role or try both/conditional logic.

export default function InventoryPage() {
	// We'll use a unified component that adapts based on data source
	return (
		<div className="container mx-auto space-y-8 py-10">
			<div className="flex flex-col space-y-2">
				<h1 className="font-bold text-3xl tracking-tight">
					Inventory Management
				</h1>
				<p className="text-muted-foreground">
					View and manage assets and supplies.
				</p>
			</div>

			<InventoryView />
		</div>
	);
}

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

function InventoryView() {
	// Use session to determine user role and call appropriate endpoint
	const { data: session, isPending: isSessionPending } =
		authClient.useSession();

	// biome-ignore lint/suspicious/noExplicitAny: role exists but not in inferred type
	const userRole = (session?.user as any)?.role;
	const isRegional =
		userRole &&
		[
			"regional-logistics-manager",
			"regional-director",
			"regional-admin",
		].includes(userRole);

	// Fetch regional data only if user is regional
	const { data: regionalData, isLoading: isRegionalLoading } = useQuery({
		queryKey: ["inventory", "all"],
		queryFn: () => client.inventory.listAll(),
		enabled: isRegional === true,
	});

	// Fetch station data only if user is NOT regional
	const { data: stationData, isLoading: isStationLoading } = useQuery({
		queryKey: ["inventory", "station"],
		queryFn: () => client.inventory.list({}),
		enabled: isRegional === false,
	});

	if (isSessionPending) {
		return (
			<div className="flex justify-center p-8">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	if (isRegional && isRegionalLoading) {
		return (
			<div className="flex justify-center p-8">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	if (isRegional && regionalData) {
		return <RegionalInventoryTable data={regionalData} />;
	}

	if (!isRegional && isStationLoading) {
		return (
			<div className="flex justify-center p-8">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	if (!isRegional && stationData) {
		return <StationInventoryTable data={stationData} />;
	}

	return <div>No inventory access or no data found.</div>;
}

// biome-ignore lint/suspicious/noExplicitAny: complex data type from ORPC
function RegionalInventoryTable({ data }: { data: any }) {
	const [filter, setFilter] = useState("");

	// Flatten data for table
	// biome-ignore lint/suspicious/noExplicitAny: flatten data
	const inventoryItems = data.inventory.map((item: any) => ({
		...item,
		type: "Supply",
		stationName: item.station?.name || "Unknown",
	}));
	// biome-ignore lint/suspicious/noExplicitAny: flatten data
	const assets = data.assets.map((item: any) => ({
		...item,
		quantity: 1,
		itemName: item.name,
		unit: "unit",
		type: "Asset",
		stationName: item.station?.name || "Unknown",
	}));

	const [page, setPage] = useState(1);
	const ITEMS_PER_PAGE = 10;

	const allItems = [...inventoryItems, ...assets].filter(
		(item) =>
			item.itemName.toLowerCase().includes(filter.toLowerCase()) ||
			item.stationName.toLowerCase().includes(filter.toLowerCase()) ||
			item.category.toLowerCase().includes(filter.toLowerCase()),
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
			<CardHeader>
				<CardTitle>Regional Inventory Overview</CardTitle>
				<CardDescription>Consolidated view of all stations.</CardDescription>
				<div className="pt-4">
					<Input
						placeholder="Search items, stations, or categories..."
						value={filter}
						onChange={(e) => {
							setFilter(e.target.value);
							setPage(1);
						}}
						className="max-w-sm"
					/>
				</div>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Station</TableHead>
							<TableHead>Item Name</TableHead>
							<TableHead>Type</TableHead>
							<TableHead>Category</TableHead>
							<TableHead>Quantity</TableHead>
							<TableHead>Status</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{paginatedItems.length === 0 ? (
							<TableRow>
								<TableCell colSpan={6} className="text-center">
									No items found.
								</TableCell>
							</TableRow>
						) : (
							paginatedItems.map((item: InventoryItem) => (
								<TableRow key={item.id}>
									<TableCell className="font-medium">
										{item.stationName}
									</TableCell>
									<TableCell>{item.itemName}</TableCell>
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
									<TableCell>{item.status || "In Stock"}</TableCell>
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

// biome-ignore lint/suspicious/noExplicitAny: complex data type
function StationInventoryTable({ data }: { data: any }) {
	// Flatten data for table (Single Station)
	// biome-ignore lint/suspicious/noExplicitAny: flatten loop
	const inventoryItems = data.inventory.map((item: any) => ({
		...item,
		type: "Supply",
	}));
	// biome-ignore lint/suspicious/noExplicitAny: flatten loop
	const assets = data.assets.map((item: any) => ({
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
					<CardTitle>Station Inventory</CardTitle>
					<CardDescription>
						Manage your station's assets and supplies.
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
					<div className="flex items-center gap-2">
						<AddItemDialog />
						<AddAssetDialog />
					</div>
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
							<TableHead className="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{paginatedItems.length === 0 ? (
							<TableRow>
								<TableCell colSpan={6} className="text-center">
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
									<TableCell className="text-right">
										{item.type === "Supply" && (
											<AdjustStockDialog item={item} />
										)}
										{item.type === "Asset" && <AssetActions item={item} />}
									</TableCell>
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
