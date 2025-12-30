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

const itemSchema = z.object({
	itemName: z.string().min(1, "Item name is required"),
	category: z.string().min(1, "Category is required"),
	quantity: z.number().min(0, "Quantity must be 0 or more"),
	unit: z.string().min(1, "Unit is required"),
});

export function AddItemDialog() {
	const [open, setOpen] = useState(false);
	const queryClient = useQueryClient();

	const [confirmOpen, setConfirmOpen] = useState(false);
	// biome-ignore lint/suspicious/noExplicitAny: form values type
	const [pendingValues, setPendingValues] = useState<any>(null);

	const form = useForm({
		defaultValues: {
			itemName: "",
			category: "",
			quantity: 0,
			unit: "pcs",
		},
		validators: {
			onSubmit: itemSchema,
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
			await client.inventory.createItem({
				itemName: pendingValues.itemName,
				category: pendingValues.category,
				quantity: pendingValues.quantity,
				unit: pendingValues.unit,
			});

			toast.success("Item added successfully");
			queryClient.invalidateQueries({ queryKey: ["inventory"] });
			setOpen(false);
			setConfirmOpen(false);
			form.reset();
			setPendingValues(null);
		} catch (error: unknown) {
			toast.error("Failed to add item", {
				description: (error as Error).message || "Something went wrong",
			});
			setConfirmOpen(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger
				render={
					<Button size="sm">
						<Plus className="mr-2 h-4 w-4" />
						Add Item
					</Button>
				}
			/>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Add New Inventory Item</DialogTitle>
					<DialogDescription>
						Register a new supply item to your station's inventory.
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
					<form.Field name="itemName">
						{(field) => (
							<div className="grid gap-2">
								<Label htmlFor="itemName">Item Name</Label>
								<Input
									id="itemName"
									placeholder="e.g., Bond Paper A4"
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
										<SelectItem value="Office Supplies">
											Office Supplies
										</SelectItem>
										<SelectItem value="Janitorial">Janitorial</SelectItem>
										<SelectItem value="PPE">PPE</SelectItem>
										<SelectItem value="Equipment">Equipment</SelectItem>
										<SelectItem value="Fuel">Fuel</SelectItem>
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

					<div className="grid grid-cols-2 gap-4">
						<form.Field name="quantity">
							{(field) => (
								<div className="grid gap-2">
									<Label htmlFor="quantity">Quantity</Label>
									<Input
										id="quantity"
										type="number"
										min="0"
										value={field.state.value}
										onChange={(e) => field.handleChange(Number(e.target.value))}
									/>
									{field.state.meta.errors.map((error) => (
										<p key={error?.message} className="text-red-500 text-sm">
											{error?.message}
										</p>
									))}
								</div>
							)}
						</form.Field>

						<form.Field name="unit">
							{(field) => (
								<div className="grid gap-2">
									<Label htmlFor="unit">Unit</Label>
									<Input
										id="unit"
										placeholder="e.g., pcs, boxes"
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
					</div>

					<DialogFooter>
						<form.Subscribe
							selector={(state) => [state.canSubmit, state.isSubmitting]}
						>
							{([canSubmit, isSubmitting]) => (
								<Button type="submit" disabled={!canSubmit || isSubmitting}>
									Add Item
								</Button>
							)}
						</form.Subscribe>
					</DialogFooter>
				</form>
			</DialogContent>

			<AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Confirm Add Item</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to add this item to the inventory?
						</AlertDialogDescription>
						{pendingValues && (
							<div className="mt-2 rounded-md bg-muted p-2 text-foreground text-sm">
								<p>
									<strong>Item:</strong> {pendingValues.itemName}
								</p>
								<p>
									<strong>Quantity:</strong> {pendingValues.quantity}{" "}
									{pendingValues.unit}
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
