"use client";

import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import z from "zod";
import { authClient } from "@/lib/auth-client";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export default function ForgotPasswordForm() {
	const form = useForm({
		defaultValues: {
			email: "",
		},
		onSubmit: async ({ value }) => {
			await authClient.requestPasswordReset(
				{
					email: value.email,
					redirectTo: "/reset-password",
				},
				{
					onSuccess: () => {
						toast.success("If an account exists, a reset link has been sent.");
					},
					onError: (error) => {
						toast.error(error.error.message || error.error.statusText);
					},
				},
			);
		},
		validators: {
			onSubmit: z.object({
				email: z.email("Invalid email address"),
			}),
		},
	});

	return (
		<div className="mx-auto w-full max-w-md p-6">
			<h2 className="mb-6 font-bold text-2xl">Forgot Password</h2>
			<p className="mb-4 text-gray-600 text-sm">
				Enter your email address and we'll send you a link to reset your
				password.
			</p>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				className="space-y-4"
			>
				<div>
					<form.Field name="email">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Email</Label>
								<Input
									id={field.name}
									name={field.name}
									type="email"
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
							{state.isSubmitting ? "Sending..." : "Send Reset Link"}
						</Button>
					)}
				</form.Subscribe>
			</form>
		</div>
	);
}
