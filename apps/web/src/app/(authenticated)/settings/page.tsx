"use client";

import { Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-2">
				<h2 className="font-bold text-3xl tracking-tight">Settings</h2>
				<p className="text-muted-foreground">Manage application settings</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Settings className="h-5 w-5" />
						System Settings
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col items-center justify-center py-12 text-center">
						<div className="mb-4 rounded-full bg-muted p-4">
							<Settings className="h-8 w-8 text-muted-foreground" />
						</div>
						<h3 className="font-semibold text-lg">Coming Soon</h3>
						<p className="mt-2 max-w-sm text-muted-foreground">
							System-wide settings and configuration options will be available
							here in a future update.
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
