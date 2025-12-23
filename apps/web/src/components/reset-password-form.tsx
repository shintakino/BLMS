"use client";

import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import z from "zod";
import { authClient } from "@/lib/auth-client";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export default function ResetPasswordForm() {
	const router = useRouter();
	const form = useForm({
		defaultValues: {
			newPassword: "",
			confirmPassword: "",
		},
		onSubmit: async ({ value }) => {
			await authClient.resetPassword(
				{
					newPassword: value.newPassword,
				},
				{
					onSuccess: () => {
						toast.success("Password reset successfully");
						router.push("/login");
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

	return (
		<div className="mx-auto w-full max-w-md p-6">
			<h2 className="mb-6 font-bold text-2xl">Reset Password</h2>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				className="space-y-4"
			>
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
							{state.isSubmitting ? "Resetting..." : "Reset Password"}
						</Button>
					)}
				</form.Subscribe>
			</form>
		</div>
	);
}
