"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { StationInventoryTable } from "@/components/inventory/station-inventory-table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { client } from "@/utils/orpc";

export default function StationDetailsPage() {
	const params = useParams();
	const stationId = params.id as string;

	// Fetch station inventory and details
	const { data, isLoading, error } = useQuery({
		queryKey: ["station-inventory", stationId],
		queryFn: async () => await client.inventory.list({ stationId }),
		enabled: !!stationId,
	});

	if (error) {
		return (
			<div className="container mx-auto flex flex-col items-center justify-center space-y-4 py-10">
				<p className="text-red-500">Failed to load station details.</p>
				<Button asChild variant="outline">
					<Link
						href={
							/* biome-ignore lint/suspicious/noExplicitAny: valid new route */
							"/stations" as any
						}
					>
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Stations
					</Link>
				</Button>
			</div>
		);
	}

	// Extract station details from the first item (either inventory or asset)
	const station =
		data?.inventory[0]?.station || data?.assets[0]?.station || undefined;
	const stationName = station?.name || "Station Details";

	return (
		<div className="container mx-auto space-y-8 py-10">
			<div className="space-y-4">
				<Button asChild variant="ghost" className="pl-0">
					<Link
						href={
							/* biome-ignore lint/suspicious/noExplicitAny: valid new route */
							"/stations" as any
						}
					>
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Directory
					</Link>
				</Button>

				<div className="flex flex-col space-y-2">
					{isLoading ? (
						<Skeleton className="h-10 w-64" />
					) : (
						<div className="flex items-baseline gap-4">
							<h1 className="font-bold text-3xl tracking-tight">
								{stationName}
							</h1>
							{stationId && (
								<p className="font-mono text-muted-foreground text-sm">
									{stationId}
								</p>
							)}
						</div>
					)}
					{station && (
						<div className="flex items-center text-muted-foreground">
							<MapPin className="mr-2 h-4 w-4" />
							<span>
								Station ID: {station.id}
								{/* Placeholder for location if available in schema */}
							</span>
						</div>
					)}
				</div>
			</div>

			{isLoading ? (
				<div className="space-y-4">
					<Skeleton className="h-12 w-full" />
					<Skeleton className="h-64 w-full" />
				</div>
			) : data ? (
				<StationInventoryTable
					data={data}
					title="Current Inventory"
					readOnly={true}
				/>
			) : (
				<div className="py-10 text-center text-muted-foreground">
					No data found for this station.
				</div>
			)}
		</div>
	);
}
