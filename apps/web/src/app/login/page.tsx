"use client";

import Image from "next/image";
import { useState } from "react";
import { EmberParticles } from "@/components/ember-particles";
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
			<div className="relative hidden h-full flex-col bg-slate-950 p-10 text-white lg:flex dark:border-r">
				<div className="absolute inset-0 z-0">
					<Image
						src="/images/firemanSignIn.png"
						alt="Firefighter Background"
						fill
						className="object-cover"
						priority
						quality={90}
					/>
					<div className="absolute inset-0 bg-gradient-to-br from-red-600/40 via-transparent to-slate-950/80 mix-blend-overlay" />
					<div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-orange-500/20 mix-blend-screen" />
					<div className="absolute inset-0 bg-gradient-to-r from-red-900/30 via-transparent to-transparent mix-blend-overlay" />
					<EmberParticles />
				</div>

				<div className="relative z-20 mt-auto">
					<blockquote className="space-y-2 border-red-600 border-l-2 pl-6">
						<p className="font-medium text-lg text-slate-100 italic leading-relaxed">
							&ldquo;Efficient logistics saves lives. Ensuring the right
							equipment gets to the right station at the right time.&rdquo;
						</p>
						<footer className="font-semibold text-slate-300 text-sm tracking-wide">
							Bureau of Fire Protection
						</footer>
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
