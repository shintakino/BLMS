"use client";

import Image from "next/image";
import { useState } from "react";
import { EmberParticles } from "@/components/ember-particles";
import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";

export default function LoginPage() {
	const [showSignIn, setShowSignIn] = useState(true);

	return (
		<div className="relative min-h-screen grid lg:grid-cols-12 bg-slate-950 font-mono text-slate-200 crt-scanline overflow-hidden">
			
			{/* Left Side: Branding, Fireman & Particles */}
			<div className="relative hidden lg:flex lg:col-span-7 flex-col justify-end p-12 overflow-hidden border-r border-white/10">
				<div className="absolute inset-0 z-0">
					<Image
						src="/images/firemanSignIn.png"
						alt="Firefighter Background"
						fill
						className="object-cover filter brightness-50 contrast-125"
						priority
						quality={85}
					/>
					<div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
					<div className="absolute inset-0 bg-red-950/30 mix-blend-color" />
					<div className="absolute inset-0 z-0 pointer-events-none tactical-grid" />
					<EmberParticles />
				</div>

				<div className="relative z-10 space-y-4 border-l-4 border-red-600 pl-6 max-w-xl">
					<p className="text-lg text-slate-100 italic leading-relaxed">
						&ldquo;COMPLIANCE AND STRUCTURAL READINESS REDUCE RESPONSE LATENCY. ALL SYSTEMS 
						ONLINE. ENSURE ASSETS ARE VERIFIED PRIOR TO SIGN-OFF.&rdquo;
					</p>
					<footer className="font-bold text-xs uppercase tracking-widest text-slate-400">
						Bureau of Fire Protection Region XII Logistics Office
					</footer>
				</div>
			</div>

			{/* Right Side: Rigorous Access Terminal Form */}
			<div className="lg:col-span-5 flex flex-col justify-center px-6 py-12 lg:px-16 bg-slate-950 relative">
				<div className="absolute inset-0 z-0 pointer-events-none tactical-grid opacity-30" />
				
				<div className="relative z-10 mx-auto w-full max-w-md space-y-8">
					<div className="flex items-center gap-4 border-b border-white/10 pb-6">
						<div className="relative h-12 w-12 shrink-0">
							<Image src="/images/bfpRegion12Logo.png" alt="BFP Region 12 Logo" fill className="object-contain" />
						</div>
						<div>
							<h2 className="font-extrabold text-lg uppercase text-white tracking-wider">COMMAND ACCESS</h2>
							<p className="text-[10px] text-slate-500 uppercase tracking-widest">BRLMS SECURE TERMINAL PORTAL</p>
						</div>
					</div>

					{/* Warning Banner */}
					<div className="border border-red-800 bg-red-950/20 p-4 text-[10px] text-red-400 uppercase leading-normal">
						[NOTICE]: SYSTEM MONITORING CURRENTLY ONLINE. ATTEMPTS TO ALTER SECURITY POLICIES OR 
						UNAUTHORIZED DATA MANIPULATION WILL TRIGGER COMPLIANCE LOGGING.
					</div>

					<div className="console-card crosshair-corner p-6 border border-white/10">
						{showSignIn ? (
							<SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
						) : (
							<SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
