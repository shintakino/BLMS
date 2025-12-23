"use client";

import { useState } from "react";
import SignInForm from "@/components/sign-in-form";
// Assuming SignUpForm exists and we want to keep it, but defaults to SignIn
// If SignUpForm doesn't exist or isn't needed, we can remove it.
// Given the previous code imported it, I'll keep the import but I need to be sure it exists.
// Use 'any' for now if unsure to prevent strict type errors if the file is simple text or missing
import SignUpForm from "@/components/sign-up-form";

export default function LoginPage() {
	const [showSignIn, setShowSignIn] = useState(true); // Default to true for Login Page

	return (
		<div className="container relative grid h-screen flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0">
			{/* Left Side - Branding/Hero */}
			<div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
				<div className="absolute inset-0 bg-zinc-900" />
				<div className="absolute inset-0 bg-gradient-to-br from-red-900 to-black opacity-90" />
				<div className="relative z-20 flex items-center font-medium text-lg">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						className="mr-2 h-6 w-6"
						aria-hidden="true"
					>
						<path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
					</svg>
					BFP Logistics
				</div>
				<div className="relative z-20 mt-auto">
					<blockquote className="space-y-2">
						<p className="text-lg">
							&ldquo;Efficient logistics saves lives. Ensuring the right
							equipment gets to the right station at the right time.&rdquo;
						</p>
						<footer className="text-sm">Bureau of Fire Protection</footer>
					</blockquote>
				</div>
			</div>

			{/* Right Side - Form */}
			<div className="lg:p-8">
				<div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
					{showSignIn ? (
						<SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
					) : (
						<SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
					)}

					<p className="px-8 text-center text-muted-foreground text-sm">
						By clicking continue, you agree to our{" "}
						<a
							href="/terms"
							className="underline underline-offset-4 hover:text-primary"
						>
							Terms of Service
						</a>{" "}
						and{" "}
						<a
							href="/privacy"
							className="underline underline-offset-4 hover:text-primary"
						>
							Privacy Policy
						</a>
						.
					</p>
				</div>
			</div>
		</div>
	);
}
