import { useForm } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import z from "zod";
import { authClient } from "@/lib/auth-client";
import { Button } from "./ui/button";

import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface SignInFormProps {
	onSwitchToSignUp?: () => void;
}

export default function SignInForm({ onSwitchToSignUp }: SignInFormProps) {
	const router = useRouter();
	const { isPending } = authClient.useSession();

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		},
		onSubmit: async ({ value }) => {
			await authClient.signIn.email(
				{
					email: value.email,
					password: value.password,
				},
				{
					onSuccess: () => {
						router.push("/dashboard");
						toast.success("Welcome back!", {
							description: "You have successfully signed in.",
						});
					},
					onError: (error) => {
						toast.error("Sign in failed", {
							description:
								error.error.message || "Please check your credentials.",
						});
					},
				},
			);
		},
		validators: {
			onSubmit: z.object({
				email: z.email("Please enter a valid email address"),
				password: z.string().min(1, "Password is required"),
			}),
		},
	});

	return (
		<div className="flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
			<div className="flex flex-col space-y-2 text-center">
				<h1 className="font-semibold text-2xl tracking-tight">
					Login to your account
				</h1>
				<p className="text-muted-foreground text-sm">
					Enter your credentials to access the system
				</p>
			</div>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				className="space-y-4"
			>
				<div className="grid gap-2">
					<form.Field name="email">
						{(field) => (
							<div className="grid gap-1">
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									placeholder="name@example.com"
									type="email"
									autoCapitalize="none"
									autoComplete="email"
									autoCorrect="off"
									disabled={isPending}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									className={
										field.state.meta.errors.length ? "border-red-500" : ""
									}
								/>
								{field.state.meta.errors.map((error) => (
									<p key={error?.message} className="text-red-500 text-xs">
										{error?.message}
									</p>
								))}
							</div>
						)}
					</form.Field>

					<form.Field name="password">
						{(field) => (
							<div className="grid gap-1">
								<div className="flex items-center justify-between">
									<Label htmlFor="password">Password</Label>
									<a
										href="/forgot-password"
										className="font-medium text-muted-foreground text-xs hover:text-primary"
									>
										Forgot password?
									</a>
								</div>
								<Input
									id="password"
									placeholder="••••••••"
									type="password"
									autoCapitalize="none"
									autoComplete="current-password"
									disabled={isPending}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									className={
										field.state.meta.errors.length ? "border-red-500" : ""
									}
								/>
								{field.state.meta.errors.map((error) => (
									<p key={error?.message} className="text-red-500 text-xs">
										{error?.message}
									</p>
								))}
							</div>
						)}
					</form.Field>

					<form.Subscribe>
						{(state) => (
							<Button
								type="submit"
								className="mt-2 w-full"
								disabled={!state.canSubmit || state.isSubmitting || isPending}
							>
								{(state.isSubmitting || isPending) && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								Sign In
							</Button>
						)}
					</form.Subscribe>
				</div>
			</form>

			{onSwitchToSignUp && (
				<div className="text-center text-muted-foreground text-sm">
					Don&apos;t have an account?{" "}
					<button
						type="button"
						onClick={onSwitchToSignUp}
						className="underline underline-offset-4 hover:text-primary"
					>
						Sign up
					</button>
				</div>
			)}
		</div>
	);
}
