"use client";

import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Loader2, Search } from "lucide-react";
import { useState } from "react";
import { StationInventoryTable } from "@/components/inventory/station-inventory-table";
import { buttonVariants } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { client } from "@/utils/orpc";

// ... (existing comments)

export default function InventoryPage() {
	// ... (existing render)
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

function InventoryView() {
	// Use session to determine user role
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

	if (isRegional) {
		return <RegionalInventoryManager />;
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

function RegionalInventoryManager() {
	const [selectedStationId, setSelectedStationId] = useState<string>("");
	const [open, setOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");

	const { data: stations } = useQuery({
		queryKey: ["stations-list"],
		queryFn: async () => await client.inventory.listStations(),
	});

	const { data: inventoryData, isLoading: inventoryLoading } = useQuery({
		queryKey: ["inventory", selectedStationId],
		queryFn: async () =>
			await client.inventory.list({ stationId: selectedStationId }),
		enabled: !!selectedStationId,
	});

	const filteredStations = stations?.filter((station) =>
		station.name.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Select Station</CardTitle>
					<CardDescription>
						Choose a station to view its inventory and assets.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="w-[300px]">
						<Popover open={open} onOpenChange={setOpen}>
							<PopoverTrigger
								role="combobox"
								aria-expanded={open}
								className={cn(
									buttonVariants({ variant: "outline" }),
									"w-full justify-between",
								)}
							>
								{selectedStationId
									? stations?.find((s) => s.id === selectedStationId)?.name
									: "Select a station..."}
								<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
							</PopoverTrigger>
							<PopoverContent className="w-[300px] p-0" align="start">
								<div className="flex items-center border-b px-3">
									<Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
									<input
										className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
										placeholder="Search station..."
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
									/>
								</div>
								<div className="max-h-[300px] overflow-y-auto p-1">
									{!filteredStations || filteredStations.length === 0 ? (
										<p className="p-2 text-center text-muted-foreground text-sm">
											No station found.
										</p>
									) : (
										filteredStations.map((station) => (
											<button
												type="button"
												key={station.id}
												className={cn(
													"relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground",
													selectedStationId === station.id &&
														"bg-accent text-accent-foreground",
												)}
												onClick={() => {
													setSelectedStationId(station.id);
													setOpen(false);
												}}
											>
												<Check
													className={cn(
														"mr-2 h-4 w-4",
														selectedStationId === station.id
															? "opacity-100"
															: "opacity-0",
													)}
												/>
												{station.name}
											</button>
										))
									)}
								</div>
							</PopoverContent>
						</Popover>
					</div>
				</CardContent>
			</Card>

			{selectedStationId ? (
				<div>
					{inventoryLoading ? (
						<div className="space-y-4">
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-64 w-full" />
						</div>
					) : inventoryData ? (
						<StationInventoryTable
							data={inventoryData}
							title={
								stations?.find((s) => s.id === selectedStationId)?.name ||
								"Station Inventory"
							}
							readOnly
						/>
					) : (
						<div className="p-4 text-muted-foreground">No data available.</div>
					)}
				</div>
			) : (
				<div className="flex h-48 items-center justify-center rounded-lg border border-dashed bg-muted/20 text-muted-foreground">
					<p>Please select a station to view its inventory.</p>
				</div>
			)}
		</div>
	);
}
