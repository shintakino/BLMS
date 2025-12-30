"use client";

import { useQuery } from "@tanstack/react-query";
import { MoveLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { use } from "react";

import RequestForm from "@/components/request-form";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { client } from "@/utils/orpc";

export default function EditRequestPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = use(params);

	const { data: request, isLoading } = useQuery({
		queryKey: ["request", id],
		queryFn: () => client.logistics.get({ id }),
		refetchOnWindowFocus: false,
	});

	if (isLoading) {
		return <EditRequestLoading />;
	}

	if (!request) {
		notFound();
	}

	if (request.status !== "DRAFT") {
		return (
			<div className="container mx-auto flex h-[50vh] flex-col items-center justify-center gap-4">
				<h1 className="font-bold text-2xl text-destructive">
					Request cannot be edited
				</h1>
				<p className="text-muted-foreground">
					Only requests in DRAFT status can be edited.
				</p>
				<Link
					href={`/requests/${id}`}
					className={cn(buttonVariants({ variant: "default" }))}
				>
					Go Back to Request
				</Link>
			</div>
		);
	}

	return (
		<div className="container mx-auto space-y-6 px-4 py-8">
			<div className="flex items-center gap-4">
				<Link
					href={`/requests/${id}`}
					className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
				>
					<MoveLeft className="h-4 w-4" />
				</Link>
				<h1 className="font-bold text-2xl tracking-tight">Edit Request</h1>
			</div>

			<RequestForm
				initialData={{
					priority: request.priority,
					justification: request.justification,
					items: request.items,
				}}
				requestId={id}
			/>
		</div>
	);
}

function EditRequestLoading() {
	return (
		<div className="container mx-auto space-y-6 px-4 py-8">
			<div className="flex items-center gap-4">
				<Skeleton className="h-10 w-10" />
				<Skeleton className="h-8 w-48" />
			</div>
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-32" />
					<Skeleton className="h-4 w-64" />
				</CardHeader>
				<CardContent className="space-y-6">
					<Skeleton className="h-20 w-full" />
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-10 w-full" />
				</CardContent>
			</Card>
		</div>
	);
}
