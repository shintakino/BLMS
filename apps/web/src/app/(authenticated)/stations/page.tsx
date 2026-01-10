"use client";

import { useQuery } from "@tanstack/react-query";
import { MapPin, Search, Store } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { client } from "@/utils/orpc";

export default function StationsPage() {
	const [page, setPage] = useState(1);
	const [searchFilter, setSearchFilter] = useState("");
	const limit = 10;

	// Fetch all stations
	const { data: stations, isLoading } = useQuery({
		queryKey: ["stations-list"],
		queryFn: async () => await client.inventory.listStations(),
	});

	// Filter and paginate stations
	const filteredStations = stations?.filter((s) =>
		s.name.toLowerCase().includes(searchFilter.toLowerCase()),
	);
	const totalPages = Math.ceil((filteredStations?.length || 0) / limit);
	const paginatedStations = filteredStations?.slice(
		(page - 1) * limit,
		page * limit,
	);

	return (
		<div className="container mx-auto space-y-8 py-10">
			<div className="flex flex-col space-y-2">
				<h1 className="font-bold text-3xl tracking-tight">Stations</h1>
				<p className="text-muted-foreground">
					View and manage all active stations.
				</p>
			</div>

			<Card>
				<CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<CardTitle>Stations Directory</CardTitle>
					<div className="relative w-full sm:w-64">
						<Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search stations..."
							className="pl-8"
							value={searchFilter}
							onChange={(e) => {
								setSearchFilter(e.target.value);
								setPage(1);
							}}
						/>
					</div>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="space-y-4">
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-48 w-full" />
						</div>
					) : paginatedStations && paginatedStations.length > 0 ? (
						<div className="space-y-4">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Station Name</TableHead>
										<TableHead>ID</TableHead>
										<TableHead className="text-right">Action</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{paginatedStations.map((station) => (
										<TableRow key={station.id}>
											<TableCell className="flex items-center gap-2 font-medium">
												<MapPin className="h-4 w-4 text-muted-foreground" />
												{station.name}
											</TableCell>
											<TableCell className="font-mono text-muted-foreground text-xs">
												{station.id}
											</TableCell>
											<TableCell className="text-right">
												<Button variant="outline" size="sm" asChild>
													<Link
														href={
															/* biome-ignore lint/suspicious/noExplicitAny: dynamic route */
															`/stations/${station.id}` as any
														}
													>
														View Details
													</Link>
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>

							{totalPages > 1 && (
								<Pagination>
									<PaginationContent>
										<PaginationItem>
											<PaginationPrevious
												href="#"
												onClick={(e) => {
													e.preventDefault();
													if (page > 1) setPage(page - 1);
												}}
												className={
													page === 1
														? "pointer-events-none opacity-50"
														: "cursor-pointer"
												}
											/>
										</PaginationItem>
										<PaginationItem>
											<PaginationLink href="#" isActive>
												{page}
											</PaginationLink>
										</PaginationItem>
										<PaginationItem>
											<PaginationNext
												href="#"
												onClick={(e) => {
													e.preventDefault();
													if (page < totalPages) setPage(page + 1);
												}}
												className={
													page === totalPages
														? "pointer-events-none opacity-50"
														: "cursor-pointer"
												}
											/>
										</PaginationItem>
									</PaginationContent>
								</Pagination>
							)}
						</div>
					) : (
						<div className="flex h-32 flex-col items-center justify-center text-muted-foreground">
							<Store className="mb-2 h-8 w-8 opacity-20" />
							<p>No stations found.</p>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
