"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";

import { client } from "@/utils/orpc";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";

// Schema for validation (matching API input)
type Priority = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";

interface CreateRequestInput {
	priority: Priority;
	justification?: string;
	items: {
		itemName: string;
		quantity: number;
		category: string;
	}[];
	status: "DRAFT" | "SUBMITTED";
}

const itemSchema = z.object({
	itemName: z.string().min(1, "Item name is required"),
	quantity: z.number().min(1, "Quantity must be at least 1"),
	category: z.string().min(1, "Category is required"),
	_id: z.string(),
});

export const requestSchema = z.object({
	priority: z.enum(["LOW", "NORMAL", "HIGH", "CRITICAL"]),
	justification: z
		.string()
		.min(10, "Justification must be at least 10 characters"),
	items: z.array(itemSchema).min(1, "At least one item is required"),
});

export default function RequestForm() {
	const router = useRouter();

	// ORPC Mutation for creating request
	const createRequest = useMutation({
		mutationFn: (data: CreateRequestInput) => client.logistics.create(data),
		onSuccess: () => {
			toast.success("Request submitted successfully");
			router.push("/dashboard");
		},
		onError: (error: Error) => {
			toast.error("Failed to submit request", {
				description: error.message,
			});
		},
	});

	const form = useForm({
		defaultValues: {
			priority: "NORMAL" as Priority,
			justification: "",
			items: [
				{ itemName: "", quantity: 1, category: "General", _id: "initial" },
			],
		},
		onSubmit: async ({ value }) => {
			await createRequest.mutateAsync({
				priority: value.priority,
				justification: value.justification,
				items: value.items.map(({ _id, ...rest }) => rest),
				status: "SUBMITTED",
			});
		},
		validators: {
			onChange: requestSchema,
		},
	});

	return (
		<Card className="mx-auto w-full max-w-2xl">
			<CardHeader>
				<CardTitle>Create Logistics Request</CardTitle>
				<CardDescription>
					Submit a new request for supplies or equipment.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
					className="space-y-6"
				>
					{/* Priority Field */}
					<form.Field name="priority">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor="priority">Priority Level</Label>
								<Select
									value={field.state.value}
									onValueChange={(val: string | null) =>
										field.handleChange(
											(val || "NORMAL") as
												| "LOW"
												| "NORMAL"
												| "HIGH"
												| "CRITICAL",
										)
									}
								>
									<SelectTrigger>
										<SelectValue>Select priority</SelectValue>
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="LOW">Low</SelectItem>
										<SelectItem value="NORMAL">Normal</SelectItem>
										<SelectItem value="HIGH">High</SelectItem>
										<SelectItem value="CRITICAL">Critical</SelectItem>
									</SelectContent>
								</Select>
							</div>
						)}
					</form.Field>

					{/* Justification Field */}
					<form.Field name="justification">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor="justification">Justification</Label>
								<Textarea
									id="justification"
									placeholder="Explain why these items are needed..."
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									className={
										field.state.meta.errors.length ? "border-red-500" : ""
									}
								/>
								{field.state.meta.errors?.map(
									// biome-ignore lint/suspicious/noExplicitAny: error object type
									(err: any) =>
										err ? (
											<p key={err.message} className="text-red-500 text-sm">
												{err.message}
											</p>
										) : null,
								)}
							</div>
						)}
					</form.Field>

					{/* Items List */}
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<Label>Requested Items</Label>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() =>
									form.pushFieldValue("items", {
										itemName: "",
										quantity: 1,
										category: "General",
										_id: Math.random().toString(36).substring(7),
									})
								}
							>
								<Plus className="mr-2 h-4 w-4" />
								Add Item
							</Button>
						</div>

						<form.Field name="items" mode="array">
							{(field) => {
								return (
									<div className="space-y-4">
										{field.state.value.map((item, i) => {
											return (
												<div
													key={item._id || i}
													className="flex items-end gap-3 rounded-lg border bg-slate-50 p-4 dark:bg-slate-900"
												>
													<div className="flex-1 space-y-2">
														<Label className="text-xs">Item Name</Label>
														<form.Field name={`items[${i}].itemName`}>
															{(subField) => (
																<Input
																	placeholder="e.g., Fire Hose"
																	value={subField.state.value}
																	onChange={(e) =>
																		subField.handleChange(e.target.value)
																	}
																/>
															)}
														</form.Field>
													</div>
													<div className="w-24 space-y-2">
														<Label className="text-xs">Qty</Label>
														<form.Field name={`items[${i}].quantity`}>
															{(subField) => (
																<Input
																	type="number"
																	min={1}
																	value={subField.state.value}
																	onChange={(e) =>
																		subField.handleChange(
																			Number(e.target.value),
																		)
																	}
																/>
															)}
														</form.Field>
													</div>
													<div className="w-32 space-y-2">
														<Label className="text-xs">Category</Label>
														<form.Field name={`items[${i}].category`}>
															{(subField) => (
																<Select
																	value={subField.state.value}
																	onValueChange={(val: string | null) =>
																		subField.handleChange(val || "")
																	}
																>
																	<SelectTrigger>
																		<SelectValue />
																	</SelectTrigger>
																	<SelectContent>
																		<SelectItem value="General">
																			General
																		</SelectItem>
																		<SelectItem value="PPE">PPE</SelectItem>
																		<SelectItem value="Equipment">
																			Equipment
																		</SelectItem>
																		<SelectItem value="Vehicles">
																			Vehicles
																		</SelectItem>
																	</SelectContent>
																</Select>
															)}
														</form.Field>
													</div>
													<Button
														type="button"
														variant="ghost"
														size="icon"
														className="text-red-500 hover:bg-red-50 hover:text-red-700"
														onClick={() => form.removeFieldValue("items", i)}
														disabled={field.state.value.length === 1}
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>
											);
										})}
									</div>
								);
							}}
						</form.Field>
						{form.getFieldMeta("items")?.errors?.map((err) => (
							<p
								key={err?.message || "items-error"}
								className="text-red-500 text-sm"
							>
								{err?.message}
							</p>
						))}
					</div>

					<form.Subscribe
						selector={(state) => [state.canSubmit, state.isSubmitting]}
					>
						{([canSubmit, isSubmitting]) => (
							<Button
								type="submit"
								className="w-full"
								disabled={!canSubmit || isSubmitting}
							>
								{isSubmitting && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								Submit Request
							</Button>
						)}
					</form.Subscribe>
				</form>
			</CardContent>
		</Card>
	);
}
