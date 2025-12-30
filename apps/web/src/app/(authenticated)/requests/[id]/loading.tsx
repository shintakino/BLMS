"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function RequestDetailsLoading() {
	return (
		<div className="container mx-auto space-y-8 px-4 py-10">
			<div>
				<Skeleton className="mb-4 h-8 w-20" />
				<div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
					<div>
						<Skeleton className="h-10 w-64" />
						<div className="mt-2 flex gap-3">
							<Skeleton className="h-6 w-24" />
							<Skeleton className="h-6 w-20" />
						</div>
					</div>
					<div className="flex gap-2">
						<Skeleton className="h-10 w-28" />
						<Skeleton className="h-10 w-28" />
					</div>
				</div>
			</div>

			<div className="grid gap-6 md:grid-cols-3">
				<div className="space-y-6 md:col-span-2">
					<Card>
						<CardHeader>
							<CardTitle>Justification</CardTitle>
						</CardHeader>
						<CardContent>
							<Skeleton className="h-4 w-full" />
							<Skeleton className="mt-2 h-4 w-3/4" />
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Items Requested</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								<Skeleton className="h-10 w-full" />
								<Skeleton className="h-10 w-full" />
								<Skeleton className="h-10 w-full" />
							</div>
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
									<Skeleton className="h-4 w-32" />
									<Skeleton className="mt-1 h-3 w-24" />
								</div>
								<div className="relative">
									<div className="absolute top-1 -left-[21px] h-3 w-3 rounded-full bg-blue-500" />
									<Skeleton className="h-4 w-24" />
									<Skeleton className="mt-1 h-3 w-20" />
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
