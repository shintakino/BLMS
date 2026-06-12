"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import {
	Activity,
	AlertTriangle,
	ArrowRight,
	Building2,
	CheckCircle2,
	FileText,
	ShieldAlert,
	Truck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { EmberParticles } from "@/components/ember-particles";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export default function LandingPage() {
	const { scrollY } = useScroll();
	const { data: session } = authClient.useSession();
	const heroTextY = useTransform(scrollY, [0, 500], [0, 60]);

	// Mock data representing BFP Region XII provinces
	const regionXIIProvinces = [
		{
			name: "South Cotabato",
			stations: 11,
			status: "NOMINAL",
			color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
		},
		{
			name: "Cotabato (North)",
			stations: 18,
			status: "NOMINAL",
			color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
		},
		{
			name: "Sultan Kudarat",
			stations: 12,
			status: "LOW_STOCK",
			color: "text-amber-500 bg-amber-500/10 border-amber-500/30",
		},
		{
			name: "Sarangani",
			stations: 7,
			status: "NOMINAL",
			color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
		},
		{
			name: "General Santos City",
			stations: 4,
			status: "CRITICAL",
			color: "text-red-500 bg-red-500/10 border-red-500/30",
		},
	];

	return (
		<div className="crt-scanline relative min-h-screen overflow-x-hidden bg-slate-950 font-mono text-slate-100">
			{/* Global Background */}
			<div className="absolute inset-0 z-0 flex justify-center bg-slate-950 opacity-40">
				<Image
					src="/images/fireman.png"
					alt="Firefighter Background"
					fill
					className="object-cover object-top brightness-50 contrast-125 filter"
					priority
					quality={75}
				/>
				<div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/70 to-slate-950" />
			</div>

			<div className="tactical-grid pointer-events-none absolute inset-0 z-0" />

			{/* Main Hero & Console Entrance */}
			<section className="container relative z-10 mx-auto px-6 py-20 lg:py-32">
				<div className="grid items-center gap-12 lg:grid-cols-12">
					{/* Left: Terminal Readouts & Access Controls */}
					<motion.div
						style={{ y: heroTextY }}
						className="space-y-8 text-left lg:col-span-7"
					>
						<div className="inline-flex items-center gap-2 border border-red-500/30 bg-red-500/10 px-3 py-1 text-red-500 text-xs uppercase tracking-widest">
							<span className="h-2 w-2 animate-ping rounded-full bg-red-500" />
							<span>{"/// BFP LOGISTICS COMMAND: ACTIVE"}</span>
						</div>

						{/* Brand Logos Floating */}
						<div className="flex items-center gap-6">
							<motion.div
								animate={{ y: [0, -8, 0] }}
								transition={{
									duration: 4,
									repeat: Number.POSITIVE_INFINITY,
									ease: "easeInOut",
								}}
								className="relative h-20 w-20 drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]"
							>
								<Image
									src="/images/bfpNationalLogo.png"
									alt="BFP National Logo"
									fill
									className="object-contain"
								/>
							</motion.div>
							<motion.div
								animate={{ y: [-5, 5, -5] }}
								transition={{
									duration: 4.5,
									repeat: Number.POSITIVE_INFINITY,
									ease: "easeInOut",
								}}
								className="relative h-20 w-20 drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]"
							>
								<Image
									src="/images/bfpRegion12Logo.png"
									alt="BFP Region 12 Logo"
									fill
									className="object-contain"
								/>
							</motion.div>
						</div>

						<h1 className="font-extrabold text-3xl uppercase leading-none tracking-tight md:text-5xl">
							BUREAU OF FIRE PROTECTION <br />
							<span className="mt-2 inline-block bg-red-600 px-3 py-1 text-white">
								REGION XII LOGISTICS
							</span>
						</h1>

						<p className="max-w-xl border-red-600 border-l-4 pl-4 text-slate-400 text-sm leading-relaxed">
							THE CENTRALIZED AUDITABLE COMMAND TERMINAL FOR INVENTORY
							DISPOSITION, SUPPLY DISPATCH, AND ACCOUNTABLE CHAIN-OF-COMMAND
							OVERRIDE.
						</p>

						<div className="flex flex-wrap gap-4">
							<Link href={session ? "/dashboard" : "/login"}>
								<Button className="h-11 rounded-none border border-foreground bg-red-600 font-bold text-white text-xs uppercase tracking-wider shadow-[4px_4px_0px_0px_#000] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000]">
									{session
										? "Enter Operations Room"
										: "Authorize Terminal Access"}
									<ArrowRight className="ml-2 h-4 w-4" />
								</Button>
							</Link>
						</div>
					</motion.div>

					{/* Right: Operational Status Matrix Panel */}
					<motion.div className="console-card crosshair-corner space-y-6 border border-white/10 p-6 lg:col-span-5">
						<div className="flex items-center justify-between border-white/10 border-b pb-4">
							<div className="flex items-center gap-3">
								<Activity className="h-5 w-5 text-red-500" />
								<div>
									<h3 className="font-bold text-white text-xs uppercase">
										REGIONAL STATUS MATRIX
									</h3>
									<p className="text-[10px] text-slate-500">
										Node telemetry update online
									</p>
								</div>
							</div>
							<Badge
								variant="outline"
								className="border-emerald-500/30 bg-emerald-500/5 text-[10px] text-emerald-400"
							>
								SECURE CONNECTION
							</Badge>
						</div>

						<div className="space-y-3">
							{regionXIIProvinces.map((prov) => (
								<div
									key={prov.name}
									className="flex items-center justify-between border border-white/5 bg-slate-950/60 p-3 text-xs"
								>
									<span className="font-bold text-slate-300 uppercase">
										{prov.name}
									</span>
									<div className="flex items-center gap-3">
										<span className="text-slate-500">
											{prov.stations} STATIONS
										</span>
										<span
											className={`border px-2 py-0.5 font-bold text-[9px] ${prov.color}`}
										>
											{prov.status}
										</span>
									</div>
								</div>
							))}
						</div>

						{/* Security Notice Indicator */}
						<div className="flex gap-3 border border-red-900/30 bg-red-950/20 p-4 text-[10px] text-red-400">
							<AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
							<div>
								<span className="block font-bold uppercase">
									[SECURITY STATEMENT]:
								</span>
								UNAUTHORIZED ACCESS AND LOGISTICS ALTERATION ATTEMPTS ARE
								GEOLOCATED, LOGGED, AND FORWARDED TO THE BFP OFFICE OF THE
								REGIONAL DIRECTOR.
							</div>
						</div>
					</motion.div>
				</div>
			</section>

			{/* Embers Fire Animation */}
			<div className="pointer-events-none absolute inset-0 z-0">
				<EmberParticles />
			</div>

			{/* System Purpose Cards */}
			<section className="container relative z-10 mx-auto border-white/5 border-t bg-slate-950/40 px-6 py-20">
				<div className="mx-auto mb-16 max-w-4xl space-y-3 text-center">
					<h2 className="font-bold text-2xl text-red-500 uppercase tracking-widest">
						OPERATIONAL OBJECTIVES
					</h2>
					<p className="mx-auto max-w-xl text-slate-400 text-sm">
						Enforcing structural compliance, item traceability, and
						chain-of-command accountability.
					</p>
				</div>

				<div className="grid gap-8 md:grid-cols-3">
					<PurposeCard
						icon={<Activity className="h-8 w-8 text-red-500" />}
						title="INVENTORY DISPOSITION"
						description="Real-time hardware status metrics and asset tracking across municipal command units."
					/>
					<PurposeCard
						icon={<FileText className="h-8 w-8 text-red-500" />}
						title="COMMAND WORKFLOWS"
						description="Accountable logistics routing from Supply Officers up to Regional Director overrides."
					/>
					<PurposeCard
						icon={<CheckCircle2 className="h-8 w-8 text-red-500" />}
						title="IMMUTABLE AUDITS"
						description="Full cryptographic logging of status changes, transactions, approvals and user operations."
					/>
				</div>
			</section>

			{/* Scope & Workflow */}
			<section className="container relative z-10 mx-auto border-white/5 border-t bg-slate-950/20 px-6 py-20">
				<div className="grid gap-16 lg:grid-cols-2">
					<div>
						<div className="mb-6 flex items-center gap-3">
							<Building2 className="h-6 w-6 text-red-500" />
							<h3 className="font-bold text-white text-xl uppercase tracking-wider">
								Organizational Scope
							</h3>
						</div>
						<div className="space-y-4 text-slate-400 text-sm">
							<p>
								This command terminal is strictly limited to operations within:
							</p>
							<ul className="list-inside list-disc space-y-2 marker:text-red-500">
								<li>Region XII – SOCCSKSARGEN Jurisdiction</li>
								<li>
									Provinces, cities, and municipalities under regional decree
								</li>
								<li>Authorized BFP fire stations and logistics depots</li>
							</ul>
							<Alert
								variant="destructive"
								className="mt-8 border-red-500/30 bg-red-950/20 text-red-200"
							>
								<AlertTriangle className="h-5 w-5" />
								<AlertTitle className="font-bold text-xs uppercase">
									Restricted Terminal Access
								</AlertTitle>
								<AlertDescription className="text-xs">
									Cross-region access is strictly prohibited. Terminal logs are
									subject to active auditable review.
								</AlertDescription>
							</Alert>
						</div>
					</div>

					<div>
						<div className="mb-6 flex items-center gap-3">
							<Truck className="h-6 w-6 text-red-500" />
							<h3 className="font-bold text-white text-xl uppercase tracking-wider">
								Operational Workflow
							</h3>
						</div>
						<div className="relative space-y-8 border-white/10 border-l pl-6">
							<WorkflowStep action="Initiate request, verify item specifications and attach operational justification documents." />
							<WorkflowStep action="Review and validate locally. Apply station commander seal and validate disposition." />
							<WorkflowStep action="Consolidate reviews at RLM level, then secure final director sign-off or disapproval override." />
						</div>
					</div>
				</div>
			</section>

			{/* Disclaimer */}
			<section className="container relative z-10 mx-auto border-white/5 border-t bg-slate-950/60 px-6 py-10">
				<Alert className="border-amber-500/30 bg-amber-950/10 text-amber-200">
					<ShieldAlert className="h-5 w-5 text-amber-500" />
					<AlertTitle className="font-bold text-xs uppercase">
						NOTICE AND DISCLAIMER
					</AlertTitle>
					<AlertDescription className="text-xs">
						This system is intended for official BFP use only. Unauthorized
						actions, data misuse, or circumvention of logistics procedures is
						subject to administrative and legal action under applicable
						military/civil service regulations and Philippine laws.
					</AlertDescription>
				</Alert>
			</section>

			{/* Footer */}
			<footer className="relative z-10 border-white/5 border-t bg-slate-950/80 py-12 text-center text-slate-500 text-xs">
				<div className="container mx-auto space-y-3 px-6">
					<div className="font-bold text-slate-300 uppercase">
						Bureau of Fire Protection – Region XII
					</div>
					<div>SOCCSKSARGEN Operations Terminal</div>
					<div className="opacity-60">
						For access credentials and compliance audits, contact the regional
						command center.
					</div>
				</div>
			</footer>
		</div>
	);
}

function PurposeCard({
	icon,
	title,
	description,
}: {
	icon: React.ReactNode;
	title: string;
	description: string;
}) {
	return (
		<div className="console-card crosshair-corner border border-white/5 bg-slate-900/40 p-6 text-slate-200">
			<div className="mb-4">{icon}</div>
			<h3 className="mb-2 font-bold text-base text-white uppercase">{title}</h3>
			<p className="text-slate-400 text-xs leading-relaxed">{description}</p>
		</div>
	);
}

function WorkflowStep({ role, action }: { role: string; action: string }) {
	return (
		<div className="relative border border-white/5 bg-slate-900/30 p-4">
			<span className="absolute top-5 -left-[31px] flex h-2 w-2 rounded-full bg-red-600 shadow-[0_0_10px_#ef4444]" />
			<h4 className="mb-1 font-bold text-white text-xs uppercase">{role}</h4>
			<p className="text-slate-400 text-xs leading-relaxed">{action}</p>
		</div>
	);
}
