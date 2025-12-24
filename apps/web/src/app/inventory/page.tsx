"use client";

import { useQuery } from "@tanstack/react-query";

import { Loader2 } from "lucide-react";
import { useState } from "react";

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
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
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
	// Attempt to fetch as Station user first (since typical user count > regional count)
	// Actually, we can just use two queries and see which one is enabled/returns data?
	// Or better: use the auth hook properly.

	// Let's rely on the fact that `listAll` is for regional, `list` is for station.
	// We will try `listAll` first? No, that throws FORBIDDEN for station.
	// We need to know the role...
	// Let's implement a role-agnostic loader or just fetch `list` (which works for station) and catch error?
	// But `list` forces stationId for station user.
	// Wait, Region users can ALSO use `list` if they provide stationId.
	// `listAll` is special.

	// Implementation Strategy:
	// We'll use a client-side role check from `useSession` if available, or just try to load `listAll`.
	// Since we don't have convenient `useSession` imported here easily without setting up context,
	// let's try `listAll` query. If it errors (FORBIDDEN), we fall back to `list`.

	const {
		data: regionalData,
		isError: isRegionalError,
		isLoading: isRegionalLoading,
	} = useQuery({
		queryKey: ["inventory", "all"],
		queryFn: () => client.inventory.listAll(),
		retry: false, // Don't retry if forbidden
	});

	const { data: stationData, isLoading: isStationLoading } = useQuery({
		queryKey: ["inventory", "station"],
		queryFn: () => client.inventory.list({}),
		enabled: isRegionalError, // Only fetch this if regional failed (likely forbidden)
	});

	if (isRegionalLoading) {
		return (
			<div className="flex justify-center p-8">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	if (!isRegionalError && regionalData) {
		return <RegionalInventoryTable data={regionalData} />;
	}

	if (isStationLoading) {
		return (
			<div className="flex justify-center p-8">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	if (stationData) {
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

	const allItems = [...inventoryItems, ...assets].filter(
		(item) =>
			item.itemName.toLowerCase().includes(filter.toLowerCase()) ||
			item.stationName.toLowerCase().includes(filter.toLowerCase()) ||
			item.category.toLowerCase().includes(filter.toLowerCase()),
	);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Regional Inventory Overview</CardTitle>
				<CardDescription>Consolidated view of all stations.</CardDescription>
				<div className="pt-4">
					<Input
						placeholder="Search items, stations, or categories..."
						value={filter}
						onChange={(e) => setFilter(e.target.value)}
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
						{allItems.length === 0 ? (
							<TableRow>
								<TableCell colSpan={6} className="text-center">
									No items found.
								</TableCell>
							</TableRow>
						) : (
							allItems.map((item: InventoryItem) => (
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

	const allItems = [...inventoryItems, ...assets];

	return (
		<Card>
			<CardHeader>
				<CardTitle>Station Inventory</CardTitle>
				<CardDescription>
					Manage your station's assets and supplies.
				</CardDescription>
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
						</TableRow>
					</TableHeader>
					<TableBody>
						{allItems.length === 0 ? (
							<TableRow>
								<TableCell colSpan={5} className="text-center">
									No items found.
								</TableCell>
							</TableRow>
						) : (
							allItems.map((item: InventoryItem) => (
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
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}
