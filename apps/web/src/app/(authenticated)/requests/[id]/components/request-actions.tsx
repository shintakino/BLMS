"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	Check,
	FileCheck,
	Gavel,
	Loader2,
	Send,
	Trash2,
	X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
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
import { Textarea } from "@/components/ui/textarea";
import { client } from "@/utils/orpc";

interface RequestActionsProps {
	requestId: string;
	currentStatus: string;
	userRole: string;
}

interface ValidateInput {
	requestId: string;
	action: "VALIDATE" | "REJECT";
	remarks?: string;
}

interface ConsolidateInput {
	requestId: string;
	action: "REVIEW" | "REJECT";
	remarks?: string;
}

interface FinalApproveInput {
	requestId: string;
	action: "APPROVE" | "REJECT";
	remarks?: string;
}

interface SubmitRequestInput {
	requestId: string;
}

export default function RequestActions({
	requestId,
	currentStatus,
	userRole,
}: RequestActionsProps) {
	const router = useRouter();
	const [remarks, setRemarks] = useState("");
	const queryClient = useQueryClient();

	// Remove activeAction state as we pass it directly
	// const [activeAction, setActiveAction] = useState<string | null>(null);

	// Track which dialog is open to handle closing programmatically if needed,
	// or just let the mutation success close it.
	// Actually, we can use a simpler approach: pass a callback to close the dialog.
	// Or even simpler: Use detailed useMutation states?

	// Mutations
	const validateRequest = useMutation({
		mutationFn: (data: ValidateInput) => client.logistics.validate(data),
		onSuccess: () => {
			toast.success("Request processed successfully");
			queryClient.invalidateQueries({ queryKey: ["request", requestId] });
			queryClient.invalidateQueries({ queryKey: ["requests"] });
			queryClient.invalidateQueries({ queryKey: ["requests-stats"] });
			router.refresh();
		},
	});

	const consolidateRequest = useMutation({
		mutationFn: (data: ConsolidateInput) => client.logistics.consolidate(data),
		onSuccess: () => {
			toast.success("Requests consolidated successfully");
			queryClient.invalidateQueries({ queryKey: ["request", requestId] });
			queryClient.invalidateQueries({ queryKey: ["requests"] });
			queryClient.invalidateQueries({ queryKey: ["requests-stats"] });
			router.refresh();
		},
	});

	const finalApproveRequest = useMutation({
		mutationFn: (data: FinalApproveInput) =>
			client.logistics.finalApprove(data),
		onSuccess: () => {
			toast.success("Request final approved");
			queryClient.invalidateQueries({ queryKey: ["request", requestId] });
			queryClient.invalidateQueries({ queryKey: ["requests"] });
			queryClient.invalidateQueries({ queryKey: ["requests-stats"] });
			router.refresh();
		},
	});

	const submitRequest = useMutation({
		mutationFn: (data: SubmitRequestInput) => client.logistics.submit(data),
		onSuccess: () => {
			toast.success("Request submitted successfully");
			queryClient.invalidateQueries({ queryKey: ["request", requestId] });
			queryClient.invalidateQueries({ queryKey: ["requests"] });
			queryClient.invalidateQueries({ queryKey: ["requests-stats"] });
			router.refresh();
		},
	});

	const deleteRequest = useMutation({
		mutationFn: (data: { requestId: string }) => client.logistics.delete(data),
		onSuccess: () => {
			toast.success("Request deleted successfully");
			queryClient.invalidateQueries({ queryKey: ["requests"] });
			queryClient.invalidateQueries({ queryKey: ["requests-stats"] });
			router.push("/dashboard");
		},
	});

	// Store loading state here based on mutation
	const isPending =
		validateRequest.isPending ||
		consolidateRequest.isPending ||
		finalApproveRequest.isPending ||
		submitRequest.isPending ||
		deleteRequest.isPending;

	const handleAction = async (action: string, closeDialog?: () => void) => {
		try {
			if (userRole === "station-commander") {
				await validateRequest.mutateAsync({
					requestId,
					action: action === "APPROVE" ? "VALIDATE" : "REJECT",
					remarks,
				});
			} else if (userRole === "regional-logistics-manager") {
				await consolidateRequest.mutateAsync({
					requestId,
					action: action === "APPROVE" ? "REVIEW" : "REJECT",
					remarks,
				});
			} else if (userRole === "regional-director") {
				await finalApproveRequest.mutateAsync({
					requestId,
					action: action === "APPROVE" ? "APPROVE" : "REJECT",
					remarks,
				});
			} else if (userRole === "supply-officer" && action === "SUBMIT") {
				await submitRequest.mutateAsync({
					requestId,
				});
			} else if (userRole === "supply-officer" && action === "DELETE") {
				await deleteRequest.mutateAsync({
					requestId,
				});
			}
			setRemarks("");
			if (closeDialog) closeDialog();
		} catch (err: unknown) {
			toast.error(err instanceof Error ? err.message : "Action failed");
		}
	};

	// Render logic based on Role + Status
	// SC: SUBMITTED -> VALIDATED / REJECTED
	// RLM: VALIDATED -> REVIEWED / REJECTED
	// RD: REVIEWED -> APPROVED / REJECTED

	if (userRole === "supply-officer" && currentStatus === "DRAFT") {
		return (
			<div className="flex gap-2">
				<Link href={`/requests/${requestId}/edit`}>
					<Button variant="outline">
						<FileCheck className="mr-2 h-4 w-4" /> Edit
					</Button>
				</Link>

				<ConfirmDialog
					trigger={
						<Button className="bg-blue-600 hover:bg-blue-700">
							<Send className="mr-2 h-4 w-4" /> Submit Request
						</Button>
					}
					title="Submit Request"
					description="Submit this request for approval? You can no longer edit it after submission."
					actionLabel="Submit"
					onConfirm={(close) => {
						handleAction("SUBMIT", close);
					}}
					isPending={isPending}
				/>

				<ConfirmDialog
					trigger={
						<Button variant="destructive">
							<Trash2 className="mr-2 h-4 w-4" /> Delete
						</Button>
					}
					title="Delete Request"
					description="Are you sure you want to delete this draft? This action cannot be undone."
					actionLabel="Delete"
					isDestructive
					onConfirm={(close) => {
						handleAction("DELETE", close);
					}}
					isPending={isPending}
				/>
			</div>
		);
	}

	if (userRole === "supply-officer" && currentStatus === "SUBMITTED") {
		return (
			<div className="flex gap-2">
				<ConfirmDialog
					trigger={
						<Button
							variant="outline"
							className="text-red-600 hover:bg-red-50 hover:text-red-700"
						>
							<X className="mr-2 h-4 w-4" /> Cancel Request
						</Button>
					}
					title="Cancel Request"
					description="Are you sure you want to cancel this submitted request? It will be permanently removed."
					actionLabel="Cancel Request"
					isDestructive
					onConfirm={(close) => {
						// Using DELETE logic for cancellation
						handleAction("DELETE", close);
					}}
					isPending={isPending}
				/>
			</div>
		);
	}

	if (userRole === "station-commander" && currentStatus === "SUBMITTED") {
		return (
			<div className="flex gap-2">
				<ActionDialog
					trigger={
						<Button className="bg-green-600 hover:bg-green-700">
							<Check className="mr-2 h-4 w-4" /> Validate
						</Button>
					}
					title="Validate Request"
					description="Confirm that this request is legitimate and necessary for the station."
					actionLabel="Validate"
					onConfirm={(close) => {
						handleAction("APPROVE", close);
					}}
					remarks={remarks}
					setRemarks={setRemarks}
					isPending={isPending}
				/>
				<ActionDialog
					trigger={
						<Button variant="destructive">
							<X className="mr-2 h-4 w-4" /> Reject
						</Button>
					}
					title="Reject Request"
					description="Provide a reason for rejecting this request."
					actionLabel="Reject"
					isDestructive
					onConfirm={(close) => {
						handleAction("REJECT", close);
					}}
					remarks={remarks}
					setRemarks={setRemarks}
					isPending={isPending}
				/>
			</div>
		);
	}

	if (
		userRole === "regional-logistics-manager" &&
		currentStatus === "VALIDATED"
	) {
		return (
			<div className="flex gap-2">
				<ActionDialog
					trigger={
						<Button className="bg-blue-600 hover:bg-blue-700">
							<FileCheck className="mr-2 h-4 w-4" /> Review & Consolidate
						</Button>
					}
					title="Review Request"
					description="Mark this request as reviewed and consolidated for RD approval."
					actionLabel="Review"
					onConfirm={(close) => {
						handleAction("APPROVE", close);
					}}
					remarks={remarks}
					setRemarks={setRemarks}
					isPending={isPending}
				/>
				<ActionDialog
					trigger={
						<Button variant="destructive">
							<X className="mr-2 h-4 w-4" /> Return/Reject
						</Button>
					}
					title="Reject Request"
					description="Send back or reject this request."
					actionLabel="Reject"
					isDestructive
					onConfirm={(close) => {
						handleAction("REJECT", close);
					}}
					remarks={remarks}
					setRemarks={setRemarks}
					isPending={isPending}
				/>
			</div>
		);
	}

	if (userRole === "regional-director" && currentStatus === "REVIEWED") {
		return (
			<div className="flex gap-2">
				<ActionDialog
					trigger={
						<Button size="lg" className="bg-green-700 hover:bg-green-800">
							<Gavel className="mr-2 h-5 w-5" /> Final Approval
						</Button>
					}
					title="Grant Final Approval"
					description="This will authorize the release/procurement of items."
					actionLabel="Approve"
					onConfirm={(close) => {
						handleAction("APPROVE", close);
					}}
					remarks={remarks}
					setRemarks={setRemarks}
					isPending={isPending}
				/>
				<ActionDialog
					trigger={
						<Button size="lg" variant="destructive">
							<X className="mr-2 h-5 w-5" /> Disapprove
						</Button>
					}
					title="Disapprove Request"
					description="Reject this request with remarks."
					actionLabel="Disapprove"
					isDestructive
					onConfirm={(close) => {
						handleAction("REJECT", close);
					}}
					remarks={remarks}
					setRemarks={setRemarks}
					isPending={isPending}
				/>
			</div>
		);
	}

	return null; // No actions available
}

function ActionDialog({
	trigger,
	title,
	description,
	actionLabel,
	onConfirm,
	remarks,
	setRemarks,
	isDestructive,
	isPending,
}: {
	trigger: React.ReactElement;
	title: string;
	description: string;
	actionLabel: string;
	onConfirm: (close: () => void) => void;
	remarks: string;
	setRemarks: (val: string) => void;
	isDestructive?: boolean;
	isPending?: boolean;
}) {
	const [open, setOpen] = useState(false);
	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				<div className="py-4">
					<Textarea
						placeholder="Add remarks (optional)..."
						value={remarks}
						onChange={(e) => setRemarks(e.target.value)}
						disabled={isPending}
					/>
				</div>
				<DialogFooter>
					<Button
						onClick={() => onConfirm(() => setOpen(false))}
						variant={isDestructive ? "destructive" : "default"}
						disabled={isPending}
					>
						{isPending ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Processing...
							</>
						) : (
							actionLabel
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function ConfirmDialog({
	trigger,
	title,
	description,
	actionLabel,
	onConfirm,
	isDestructive,
	isPending,
}: {
	trigger: React.ReactElement;
	title: string;
	description: string;
	actionLabel: string;
	onConfirm: (close: () => void) => void;
	isDestructive?: boolean;
	isPending?: boolean;
}) {
	const [open, setOpen] = useState(false);
	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={(e) => {
							e.preventDefault(); // Prevent default close, we handle it
							onConfirm(() => setOpen(false));
						}}
						className={
							isDestructive
								? "bg-red-600 hover:bg-red-700"
								: "bg-blue-600 hover:bg-blue-700"
						}
						disabled={isPending}
					>
						{isPending ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Processing...
							</>
						) : (
							actionLabel
						)}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
