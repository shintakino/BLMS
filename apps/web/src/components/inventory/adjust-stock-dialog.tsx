"use client";

import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeftRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

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
import { Textarea } from "@/components/ui/textarea";
import { client } from "@/utils/orpc";

const adjustSchema = z.object({
	type: z.enum(["IN", "OUT"]),
	quantity: z.number().min(1, "Quantity must be at least 1"),
	reason: z.string().min(3, "Reason is required"),
	reference: z.string(), // Required string, default handled by form
});

interface AdjustStockDialogProps {
	item: {
		id: string;
		itemName: string;
		quantity: number;
		unit?: string | null;
	};
}

export function AdjustStockDialog({ item }: AdjustStockDialogProps) {
	const [open, setOpen] = useState(false);
	const queryClient = useQueryClient();

	const form = useForm({
		defaultValues: {
			type: "IN" as "IN" | "OUT",
			quantity: 1,
			reason: "",
			reference: "",
		},
		validators: {
			onSubmit: adjustSchema,
		},
		onSubmit: async ({ value }) => {
			try {
				const adjustment =
					value.type === "IN" ? value.quantity : -value.quantity;

				await client.inventory.adjustStock({
					itemId: item.id,
					adjustment: adjustment,
					reason: value.reason,
					reference: value.reference,
				});

				toast.success("Stock adjusted successfully");
				queryClient.invalidateQueries({ queryKey: ["inventory"] });
				setOpen(false);
				form.reset();
			} catch (error: unknown) {
				toast.error("Failed to adjust stock", {
					description: (error as Error).message || "Something went wrong",
				});
			}
		},
	});

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger
				render={
					<Button variant="ghost" size="icon" title="Adjust Stock">
						<ArrowLeftRight className="h-4 w-4" />
					</Button>
				}
			/>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Adjust Stock: {item.itemName}</DialogTitle>
					<DialogDescription>
						Record stock in or stock out operations. Current: {item.quantity}{" "}
						{item.unit || "pcs"}
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
					<div className="grid grid-cols-2 gap-4">
						<form.Field name="type">
							{(field) => (
								<div className="grid gap-2">
									<Label>Operation Type</Label>
									<Select
										value={field.state.value}
										onValueChange={(val) => {
											if (val === "IN" || val === "OUT") {
												field.handleChange(val);
											}
										}}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="IN">Stock IN (+)</SelectItem>
											<SelectItem value="OUT">Stock OUT (-)</SelectItem>
										</SelectContent>
									</Select>
								</div>
							)}
						</form.Field>

						<form.Field name="quantity">
							{(field) => (
								<div className="grid gap-2">
									<Label>Quantity</Label>
									<Input
										type="number"
										min="1"
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
					</div>

					<form.Field name="reason">
						{(field) => (
							<div className="grid gap-2">
								<Label>Reason</Label>
								<Textarea
									placeholder="e.g., Monthly Replenishment, Broken Items, etc."
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

					<form.Field name="reference">
						{(field) => (
							<div className="grid gap-2">
								<Label>Reference (Optional)</Label>
								<Input
									placeholder="e.g., DR#12345"
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
									{isSubmitting ? "Saving..." : "Save Adjustment"}
								</Button>
							)}
						</form.Subscribe>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
