"use client";

import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { client } from "@/utils/orpc";

const assetSchema = z.object({
	name: z.string().min(1, "Asset name is required"),
	category: z.string().min(1, "Category is required"),
	serialNumber: z.string(), // Handle optionality in onSubmit
	acquiredAt: z.string(), // Handle optionality in onSubmit
});

export function AddAssetDialog() {
	const [open, setOpen] = useState(false);
	const queryClient = useQueryClient();

	const [confirmOpen, setConfirmOpen] = useState(false);
	// biome-ignore lint/suspicious/noExplicitAny: form values type
	const [pendingValues, setPendingValues] = useState<any>(null);

	const form = useForm({
		defaultValues: {
			name: "",
			category: "",
			serialNumber: "",
			acquiredAt: new Date().toISOString().split("T")[0], // Default today
		},
		validators: {
			onSubmit: assetSchema,
		},
		onSubmit: async ({ value }) => {
			// Store values and open confirmation
			setPendingValues(value);
			setConfirmOpen(true);
		},
	});

	const handleConfirm = async () => {
		if (!pendingValues) return;

		try {
			await client.inventory.createAsset({
				name: pendingValues.name,
				category: pendingValues.category,
				serialNumber: pendingValues.serialNumber || undefined,
				acquiredAt: pendingValues.acquiredAt
					? new Date(pendingValues.acquiredAt).toISOString()
					: undefined,
			});

			toast.success("Asset registered successfully");
			queryClient.invalidateQueries({ queryKey: ["inventory"] });
			setOpen(false);
			setConfirmOpen(false);
			form.reset();
			setPendingValues(null);
		} catch (error: unknown) {
			toast.error("Failed to register asset", {
				description: (error as Error).message || "Something went wrong",
			});
			setConfirmOpen(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger
				render={
					<Button size="sm" variant="outline">
						<Plus className="mr-2 h-4 w-4" />
						Register Asset
					</Button>
				}
			/>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Register New Asset</DialogTitle>
					<DialogDescription>
						Add a new accountable asset (equipment, vehicle, etc.) to your
						station.
					</DialogDescription>
				</DialogHeader>

				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
					className="space-y-4"
				>
					<form.Field name="name">
						{(field) => (
							<div className="grid gap-2">
								<Label htmlFor="name">Asset Name</Label>
								<Input
									id="name"
									placeholder="e.g., Fire Truck, Laptop, Radio"
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
								{field.state.meta.errors.map((error) => (
									<p key={error?.message} className="text-red-500 text-sm">
										{error?.message}
									</p>
								))}
							</div>
						)}
					</form.Field>

					<form.Field name="category">
						{(field) => (
							<div className="grid gap-2">
								<Label htmlFor="category">Category</Label>
								<Select
									value={field.state.value}
									onValueChange={(val) => field.handleChange(val || "")}
								>
									<SelectTrigger>
										<SelectValue>Select category</SelectValue>
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Vehicles">Vehicles</SelectItem>
										<SelectItem value="IT Equipment">IT Equipment</SelectItem>
										<SelectItem value="Furniture">Furniture</SelectItem>
										<SelectItem value="Tools">Tools</SelectItem>
										<SelectItem value="Safety Gear">
											Safety Gear (Assets)
										</SelectItem>
										<SelectItem value="Others">Others</SelectItem>
									</SelectContent>
								</Select>
								{field.state.meta.errors.map((error) => (
									<p key={error?.message} className="text-red-500 text-sm">
										{error?.message}
									</p>
								))}
							</div>
						)}
					</form.Field>

					<form.Field name="serialNumber">
						{(field) => (
							<div className="grid gap-2">
								<Label htmlFor="serialNumber">Serial Number (Optional)</Label>
								<Input
									id="serialNumber"
									placeholder="e.g., SN-123456789"
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
							</div>
						)}
					</form.Field>

					<form.Field name="acquiredAt">
						{(field) => (
							<div className="grid gap-2">
								<Label htmlFor="acquiredAt">Date Acquired</Label>
								<Input
									id="acquiredAt"
									type="date"
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
							</div>
						)}
					</form.Field>

					<DialogFooter>
						<form.Subscribe
							selector={(state) => [state.canSubmit, state.isSubmitting]}
						>
							{([canSubmit, isSubmitting]) => (
								<Button type="submit" disabled={!canSubmit || isSubmitting}>
									Register Asset
								</Button>
							)}
						</form.Subscribe>
					</DialogFooter>
				</form>
			</DialogContent>

			<AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Confirm Register Asset</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to register this asset?
						</AlertDialogDescription>
						{pendingValues && (
							<div className="mt-2 rounded-md bg-muted p-2 text-foreground text-sm">
								<p>
									<strong>Name:</strong> {pendingValues.name}
								</p>
								<p>
									<strong>Category:</strong> {pendingValues.category}
								</p>
							</div>
						)}
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={handleConfirm}>
							Confirm
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Dialog>
	);
}
