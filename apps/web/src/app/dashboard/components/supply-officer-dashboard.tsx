import { Package, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SupplyOfficerDashboard() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="font-bold text-3xl tracking-tight">Station Logistics</h2>
				{/* biome-ignore lint/suspicious/noExplicitAny: types are broken for Link href */}
				<Link href={"/requests/new" as any}>
					<Button className="bg-red-600 hover:bg-red-700">
						<Plus className="mr-2 h-4 w-4" />
						Create Request
					</Button>
				</Link>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Pending Requests
						</CardTitle>
						<Package className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">0</div>
						<p className="text-muted-foreground text-xs">
							Requests awaiting validation
						</p>
					</CardContent>
				</Card>
				{/* Add more cards as needed */}
			</div>
		</div>
	);
}
