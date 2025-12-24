"use client";

import { useMutation } from "@tanstack/react-query";
import { Check, FileCheck, Gavel, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
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

export default function RequestActions({
	requestId,
	currentStatus,
	userRole,
}: RequestActionsProps) {
	const router = useRouter();
	const [remarks, setRemarks] = useState("");
	const [activeAction, setActiveAction] = useState<string | null>(null);

	// Mutations
	const validateRequest = useMutation({
		mutationFn: (data: ValidateInput) => client.logistics.validate(data),
		onSuccess: () => {
			toast.success("Request processed successfully");
			router.refresh();
		},
	});

	const consolidateRequest = useMutation({
		mutationFn: (data: ConsolidateInput) => client.logistics.consolidate(data),
		onSuccess: () => {
			toast.success("Requests consolidated successfully");
			router.refresh();
		},
	});

	const finalApproveRequest = useMutation({
		mutationFn: (data: FinalApproveInput) =>
			client.logistics.finalApprove(data),
		onSuccess: () => {
			toast.success("Request final approved");
			router.refresh();
		},
	});

	const handleAction = async () => {
		if (!activeAction) return;

		try {
			if (userRole === "station-commander") {
				await validateRequest.mutateAsync({
					requestId,
					action: activeAction === "APPROVE" ? "VALIDATE" : "REJECT",
					remarks,
				});
			} else if (userRole === "regional-logistics-manager") {
				await consolidateRequest.mutateAsync({
					requestId,
					action: activeAction === "APPROVE" ? "REVIEW" : "REJECT",
					remarks,
				});
			} else if (userRole === "regional-director") {
				await finalApproveRequest.mutateAsync({
					requestId,
					action: activeAction === "APPROVE" ? "APPROVE" : "REJECT",
					remarks,
				});
			}
			setRemarks("");
			setActiveAction(null);
		} catch (err: unknown) {
			toast.error(err instanceof Error ? err.message : "Action failed");
		}
	};

	// Render logic based on Role + Status
	// SC: SUBMITTED -> VALIDATED / REJECTED
	// RLM: VALIDATED -> REVIEWED / REJECTED
	// RD: REVIEWED -> APPROVED / REJECTED

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
					onConfirm={() => {
						setActiveAction("APPROVE");
						handleAction();
					}}
					remarks={remarks}
					setRemarks={setRemarks}
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
					onConfirm={() => {
						setActiveAction("REJECT");
						handleAction();
					}}
					remarks={remarks}
					setRemarks={setRemarks}
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
					onConfirm={() => {
						setActiveAction("APPROVE");
						handleAction();
					}}
					remarks={remarks}
					setRemarks={setRemarks}
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
					onConfirm={() => {
						setActiveAction("REJECT");
						handleAction();
					}}
					remarks={remarks}
					setRemarks={setRemarks}
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
					onConfirm={() => {
						setActiveAction("APPROVE");
						handleAction();
					}}
					remarks={remarks}
					setRemarks={setRemarks}
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
					onConfirm={() => {
						setActiveAction("REJECT");
						handleAction();
					}}
					remarks={remarks}
					setRemarks={setRemarks}
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
}: {
	trigger: React.ReactNode;
	title: string;
	description: string;
	actionLabel: string;
	onConfirm: () => void;
	remarks: string;
	setRemarks: (val: string) => void;
	isDestructive?: boolean;
}) {
	return (
		<Dialog>
			<DialogTrigger>{trigger}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				<div className="py-4">
					<Textarea
						placeholder="Add remarks..."
						value={remarks}
						onChange={(e) => setRemarks(e.target.value)}
					/>
				</div>
				<DialogFooter>
					<Button
						onClick={onConfirm}
						variant={isDestructive ? "destructive" : "default"}
					>
						{actionLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
