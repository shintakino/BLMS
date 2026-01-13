"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { FileUpload } from "@/components/file-upload";

import { client } from "@/utils/orpc";
import { supabase } from "@/utils/supabase/client";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "./ui/alert-dialog";
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
	attachments: {
		url: string;
		name: string;
		type: string;
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
	attachments: z
		.array(
			z.object({
				url: z.string(),
				name: z.string(),
				type: z.string(),
			}),
		)
		.min(1, "At least one attachment is required"),
});

interface RequestFormProps {
	initialData?: {
		priority: Priority;
		justification?: string | null;
		items: {
			itemName: string;
			quantity: number;
			category: string;
		}[];
		attachments?: {
			url: string;
			filePath?: string; // Added for edit mode persistence
			name: string;
			type: string;
		}[];
	};
	requestId?: string;
}

export default function RequestForm({
	initialData,
	requestId,
}: RequestFormProps) {
	const router = useRouter();
	const submitIntent = React.useRef<"DRAFT" | "SUBMITTED">("SUBMITTED");
	const [confirmAction, setConfirmAction] = useState<
		"DRAFT" | "SUBMITTED" | null
	>(null);

	const queryClient = useQueryClient();

	// ORPC Mutation for creating request
	const createRequest = useMutation({
		mutationFn: (data: CreateRequestInput) => client.logistics.create(data),
		onSuccess: (_, variables) => {
			toast.success(
				variables.status === "DRAFT"
					? "Request saved as draft"
					: "Request submitted successfully",
			);
			queryClient.invalidateQueries({ queryKey: ["requests"] }); // Refresh lists
			router.push("/dashboard");
		},
		onError: (error: Error) => {
			toast.error("Failed to save request", {
				description: error.message,
			});
		},
	});

	// ORPC Mutation for updating request
	const updateRequest = useMutation({
		mutationFn: (data: CreateRequestInput & { requestId: string }) =>
			client.logistics.update(data),
		onSuccess: (_, variables) => {
			toast.success(
				variables.status === "DRAFT"
					? "Request draft updated"
					: "Request submitted successfully",
			);
			// Invalidate specific request cache so details page updates immediately
			queryClient.invalidateQueries({
				queryKey: ["request", variables.requestId],
			});
			queryClient.invalidateQueries({ queryKey: ["requests"] }); // Refresh lists
			router.push("/dashboard");
		},
		onError: (error: Error) => {
			toast.error("Failed to update request", {
				description: error.message,
			});
		},
	});

	// Local state for files (raw File objects or existing uploaded files)
	const [files, setFiles] = useState<
		(File | { url: string; name: string; type: string })[]
	>(
		initialData?.attachments?.map((att) => ({
			url: att.filePath || att.url, // Use persistent path/key if available
			name: att.name,
			type: att.type,
		})) || [],
	);
	const [isUploading, setIsUploading] = useState(false);

	const form = useForm({
		defaultValues: {
			priority: (initialData?.priority || "NORMAL") as Priority,
			justification: initialData?.justification || "",
			items: initialData?.items?.length
				? initialData.items.map((item) => ({
						...item,
						_id: Math.random().toString(36).substring(7),
					}))
				: [{ itemName: "", quantity: 1, category: "General", _id: "initial" }],
			// We don't bind 'attachments' directly to form state for the UI,
			// but we keep it compatible with schema if needed.
			// For now, we will handle attachments manually in onSubmit.
		},
		onSubmit: async ({ value }) => {
			try {
				setIsUploading(true);
				const finalAttachments: { url: string; name: string; type: string }[] =
					[];

				// 1. Process files
				for (const file of files) {
					if (file instanceof File) {
						// New file: Upload it
						const { path, token } = await client.logistics.getUploadUrl({
							fileName: file.name,
							fileType: file.type,
						});

						const { error: uploadError } = await supabase.storage
							.from("attachments")
							.uploadToSignedUrl(path, token, file);

						if (uploadError) throw new Error(`Failed to upload ${file.name}`);

						finalAttachments.push({
							url: path, // Save the path/key
							name: file.name,
							type: file.type,
						});
					} else {
						// Existing file: Keep it
						// Ensure we send the path/key, not a signed URL if we have it
						finalAttachments.push(file);
					}
				}

				if (requestId) {
					await updateRequest.mutateAsync({
						requestId,
						priority: value.priority,
						justification: value.justification,
						items: value.items.map(({ _id, ...rest }) => rest),
						attachments: finalAttachments,
						status: submitIntent.current,
					});
				} else {
					await createRequest.mutateAsync({
						priority: value.priority,
						justification: value.justification,
						items: value.items.map(({ _id, ...rest }) => rest),
						attachments: finalAttachments,
						status: submitIntent.current,
					});
				}
			} catch (error) {
				console.error("Submission error:", error);
				toast.error("Failed to submit request", {
					description:
						error instanceof Error
							? error.message
							: "One or more files failed to upload.",
				});
			} finally {
				setIsUploading(false);
			}
		},
		validators: {
			// We skip standard schema validation for attachments here because they are not in form.value
			// We can validate 'files' length manually.
			onChange: requestSchema.omit({ attachments: true }),
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
						// Handle submit manually via confirmation
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
									<SelectTrigger
										className={
											field.state.meta.errors.length ? "border-red-500" : ""
										}
									>
										<SelectValue>Select priority</SelectValue>
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="LOW">Low</SelectItem>
										<SelectItem value="NORMAL">Normal</SelectItem>
										<SelectItem value="HIGH">High</SelectItem>
										<SelectItem value="CRITICAL">Critical</SelectItem>
									</SelectContent>
								</Select>
								{field.state.meta.errors.map((err) => (
									<p key={err?.message} className="text-red-500 text-sm">
										{err?.message}
									</p>
								))}
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

					<div className="space-y-2">
						<Label>Attachments</Label>
						<FileUpload value={files} onChange={setFiles} />
						{files.length === 0 && (
							<p className="text-red-500 text-sm">
								At least one attachment is required
							</p>
						)}
					</div>

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
													className="flex flex-col gap-3 rounded-lg border bg-slate-50 p-4 md:flex-row md:items-end dark:bg-slate-900"
												>
													<div className="w-full space-y-2 md:flex-1">
														<Label className="text-xs">Item Name</Label>
														<form.Field name={`items[${i}].itemName`}>
															{(subField) => (
																<>
																	<Input
																		placeholder="e.g., Fire Hose"
																		value={subField.state.value}
																		onBlur={subField.handleBlur}
																		onChange={(e) =>
																			subField.handleChange(e.target.value)
																		}
																		className={
																			subField.state.meta.errors.length
																				? "border-red-500"
																				: ""
																		}
																	/>
																	{subField.state.meta.errors.map((err) => (
																		<p
																			key={err?.message}
																			className="text-red-500 text-xs"
																		>
																			{err?.message}
																		</p>
																	))}
																</>
															)}
														</form.Field>
													</div>
													<div className="w-full space-y-2 md:w-24">
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
													<div className="w-full space-y-2 md:w-32">
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
													<div className="flex justify-end md:block">
														<Button
															type="button"
															variant="ghost"
															size="icon"
															className="text-red-500 hover:bg-red-50 hover:text-red-700"
															onClick={() => form.removeFieldValue("items", i)}
														>
															<Trash2 className="h-4 w-4" />
														</Button>
													</div>
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
						selector={(state) =>
							[state.canSubmit, state.isSubmitting, state.values.items] as const
						}
					>
						{([canSubmit, isSubmitting, items]) => (
							<div className="flex gap-4">
								<Button
									type="button"
									variant="secondary"
									className="flex-1"
									disabled={isSubmitting || items.length === 0}
									onClick={() => {
										submitIntent.current = "DRAFT";
										setConfirmAction("DRAFT");
									}}
								>
									{isSubmitting && submitIntent.current === "DRAFT" && (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									)}
									Save as Draft
								</Button>
								<Button
									type="button"
									className="flex-1"
									disabled={
										!canSubmit ||
										isSubmitting ||
										isUploading ||
										files.length === 0 ||
										items.length === 0
									}
									onClick={() => {
										submitIntent.current = "SUBMITTED";
										setConfirmAction("SUBMITTED");
									}}
								>
									{(isSubmitting ||
										(isUploading && submitIntent.current === "SUBMITTED")) && (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									)}
									{isUploading
										? "Uploading..."
										: requestId
											? "Update & Submit"
											: "Submit Request"}
								</Button>
							</div>
						)}
					</form.Subscribe>
				</form>
			</CardContent>

			<AlertDialog
				open={!!confirmAction}
				onOpenChange={(open) => !open && setConfirmAction(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{confirmAction === "DRAFT" ? "Save as Draft?" : "Submit Request?"}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{confirmAction === "DRAFT"
								? "You can edit this later before submitting."
								: "This will submit the request for approval. You cannot edit it afterwards."}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								form.handleSubmit();
								setConfirmAction(null);
							}}
							className={
								confirmAction === "SUBMITTED"
									? "bg-blue-600 hover:bg-blue-700"
									: ""
							}
						>
							{confirmAction === "DRAFT" ? "Save Draft" : "Submit"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Card>
	);
}
