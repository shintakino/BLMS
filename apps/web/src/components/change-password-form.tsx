"use client";

import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
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

export default function ChangePasswordForm() {
	const { isPending } = authClient.useSession();

	const form = useForm({
		defaultValues: {
			currentPassword: "",
			newPassword: "",
			confirmPassword: "",
		},
		onSubmit: async ({ value }) => {
			await authClient.changePassword(
				{
					newPassword: value.newPassword,
					currentPassword: value.currentPassword,
					revokeOtherSessions: true,
				},
				{
					onSuccess: async () => {
						try {
							await fetch("/api/auth/complete-setup", { method: "POST" });
						} catch (e) {
							console.error("Failed to update user status", e);
						}
						toast.success("Password changed successfully");
						window.location.reload(); // Reload to refresh session
					},
					onError: (error) => {
						toast.error(error.error.message || error.error.statusText);
					},
				},
			);
		},
		validators: {
			onSubmit: z
				.object({
					currentPassword: z.string().min(1, "Current password is required"),
					newPassword: z
						.string()
						.min(8, "Password must be at least 8 characters"),
					confirmPassword: z.string().min(1, "Confirm password is required"),
				})
				.refine((data) => data.newPassword === data.confirmPassword, {
					message: "Passwords do not match",
					path: ["confirmPassword"],
				}),
		},
	});

	if (isPending) {
		return <div>Loading...</div>;
	}

	return (
		<Card className="mx-auto w-full max-w-md">
			<CardHeader>
				<CardTitle>Change Password</CardTitle>
				<CardDescription>
					Please update your password to continue using the application.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
					className="space-y-4"
				>
					<div>
						<form.Field name="currentPassword">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Current Password</Label>
									<Input
										id={field.name}
										name={field.name}
										type="password"
										value={field.state.value}
										onBlur={field.handleBlur}
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

					<div>
						<form.Field name="newPassword">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>New Password</Label>
									<Input
										id={field.name}
										name={field.name}
										type="password"
										value={field.state.value}
										onBlur={field.handleBlur}
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

					<div>
						<form.Field name="confirmPassword">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Confirm New Password</Label>
									<Input
										id={field.name}
										name={field.name}
										type="password"
										value={field.state.value}
										onBlur={field.handleBlur}
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

					<form.Subscribe>
						{(state) => (
							<Button
								type="submit"
								className="w-full"
								disabled={!state.canSubmit || state.isSubmitting}
							>
								{state.isSubmitting
									? "Changing Password..."
									: "Change Password"}
							</Button>
						)}
					</form.Subscribe>
				</form>
			</CardContent>
		</Card>
	);
}
