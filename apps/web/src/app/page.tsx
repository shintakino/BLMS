"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import {
	AlertTriangle,
	ArrowRight,
	BarChart3,
	Building2,
	CheckCircle2,
	FileText,
	ShieldAlert,
	Truck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
// Ember Particle Effect Component
import { EmberParticles } from "@/components/ember-particles";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";

const fadeInUp = {
	hidden: { opacity: 0, y: 20 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const staggerContainer = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.2,
		},
	},
};

export default function LandingPage() {
	const { scrollY } = useScroll();
	const { data: session } = authClient.useSession();

	// Parallax Effects
	const heroTextY = useTransform(scrollY, [0, 500], [0, 100]); // Subtle shift for text
	const embersY = useTransform(scrollY, [0, 1000], [0, 200]); // Embers move at different speed

	return (
		<div className="relative min-h-screen overflow-x-hidden bg-slate-950 text-foreground">
			{/* Hero Section */}
			{/* Global Background */}
			<div className="absolute inset-0 z-0 flex justify-center bg-slate-950">
				<Image
					src="/images/fireman.png"
					alt="Firefighter Background"
					fill
					className="scale-105 object-contain object-top opacity-50 blur-[2px] md:opacity-30"
					priority
					quality={50}
				/>
				<Image
					src="/images/fireman.png"
					alt="Firefighter Background"
					fill
					className="object-contain object-top"
					priority
					quality={90}
				/>
				<div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-slate-950/40 to-slate-950/90" />
			</div>

			{/* Hero Section */}
			<section className="relative min-h-screen overflow-hidden text-white">
				{/* Abstract background pattern removed in favor of global background */}

				{/* Fire Animation Effect with Parallax */}
				<motion.div style={{ y: embersY }} className="absolute inset-0 z-0">
					<EmberParticles />
				</motion.div>

				<motion.div
					style={{ y: heroTextY }}
					className="container relative z-10 mx-auto flex h-full flex-col items-center justify-center px-4 pt-20 text-center"
					initial="hidden"
					animate="visible"
					variants={staggerContainer}
				>
					<motion.div
						variants={fadeInUp}
						className="mb-8 flex justify-center gap-6 md:gap-12"
					>
						<div className="relative h-24 w-24 drop-shadow-2xl md:h-32 md:w-32">
							<Image
								src="/images/bfpNationalLogo.png"
								alt="BFP National Logo"
								fill
								className="object-contain"
							/>
						</div>
						<div className="relative h-24 w-24 drop-shadow-2xl md:h-32 md:w-32">
							<Image
								src="/images/bfpRegion12Logo.png"
								alt="BFP Region 12 Logo"
								fill
								className="object-contain"
							/>
						</div>
					</motion.div>

					<motion.div variants={fadeInUp} className="mb-6 flex justify-center">
						<Badge
							variant="destructive"
							className="border-red-500/50 bg-gradient-to-r from-red-900/50 to-red-950/50 px-6 py-1.5 font-semibold text-red-100 text-sm uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(239,68,68,0.5)] backdrop-blur-sm"
						>
							Official Use Only
						</Badge>
					</motion.div>

					<motion.h1
						variants={fadeInUp}
						className="mb-4 font-extrabold text-4xl leading-tight tracking-tight drop-shadow-2xl lg:text-7xl"
					>
						Bureau of Fire Protection
						<span className="mt-2 block bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
							Region XII – SOCCSKSARGEN
						</span>
					</motion.h1>

					<motion.p
						variants={fadeInUp}
						className="mx-auto mb-8 max-w-2xl text-slate-300 text-xl"
					>
						Logistics & Supply Management System
					</motion.p>

					<motion.div
						variants={fadeInUp}
						className="mx-auto max-w-xl text-slate-400"
					>
						<p className="mb-8 font-light text-lg">
							A centralized, secure, and auditable platform for managing fire
							station logistics, inventory, and supply requests within BFP
							Region XII.
						</p>
					</motion.div>

					<motion.div variants={fadeInUp} className="flex justify-center gap-4">
						<Link href={session ? "/dashboard" : "/login"}>
							<Button
								size="lg"
								className="bg-red-600 px-8 py-6 font-semibold text-lg shadow-red-900/20 shadow-xl transition-all hover:scale-105 hover:bg-red-700"
							>
								{session ? "Go to Dashboard" : "Login to System"}
								<ArrowRight className="ml-2 h-5 w-5" />
							</Button>
						</Link>
					</motion.div>

					{/* Scroll Indicator */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1, y: [0, 10, 0] }}
						transition={{
							delay: 1,
							duration: 2,
							repeat: Number.POSITIVE_INFINITY,
						}}
						className="mt-12 text-slate-500"
					>
						<div className="flex flex-col items-center gap-2">
							<span className="font-medium text-slate-400 text-xs uppercase tracking-[0.2em]">
								Scroll
							</span>
							<div className="h-12 w-[1px] bg-gradient-to-b from-slate-400 to-transparent" />
						</div>
					</motion.div>
				</motion.div>
			</section>

			{/* System Purpose */}
			<section className="relative z-20 py-24">
				<div className="container mx-auto max-w-5xl px-4">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-100px" }}
						transition={{ duration: 0.6 }}
						className="mb-16 rounded-3xl border border-white/10 bg-black/20 p-12 text-center backdrop-blur-sm"
					>
						<h2 className="mb-4 font-bold text-4xl text-white">
							System Purpose
						</h2>
						<p className="mx-auto max-w-2xl text-lg text-slate-300">
							Designed to support the operational readiness of fire stations
							across Region XII by providing accurate visibility and structured
							workflows.
						</p>
					</motion.div>

					<motion.div
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true, margin: "-100px" }}
						variants={staggerContainer}
						className="grid gap-8 md:grid-cols-3"
					>
						<PurposeCard
							icon={<BarChart3 className="h-10 w-10 text-red-600" />}
							title="Inventory Visibility"
							description="Real-time tracking of assets and supplies per fire station."
						/>
						<PurposeCard
							icon={<FileText className="h-10 w-10 text-red-600" />}
							title="Structured Workflows"
							description="Standardized request and approval processes compliant with BFP procedures."
						/>
						<PurposeCard
							icon={<CheckCircle2 className="h-10 w-10 text-red-600" />}
							title="Audit & Compliance"
							description="Complete accountability with time-stamped logs for every transaction."
						/>
					</motion.div>
				</div>
			</section>

			{/* Operational Scope & Workflow */}
			<section className="relative z-20 py-24">
				<div className="container mx-auto max-w-6xl px-4">
					<div className="grid gap-20 lg:grid-cols-2">
						{/* Scope */}
						<motion.div
							initial={{ opacity: 0, x: -50 }}
							whileInView={{ opacity: 1, x: 0 }}
							viewport={{ once: true, margin: "-100px" }}
							transition={{ duration: 0.8 }}
						>
							<div className="mb-8 flex items-center gap-3">
								<Building2 className="h-8 w-8 text-red-600" />
								<h3 className="font-bold text-3xl">Organizational Scope</h3>
							</div>
							<div className="space-y-6 text-lg text-slate-300">
								<p>This system is strictly limited to:</p>
								<ul className="list-inside list-disc space-y-3 marker:text-red-500">
									<li>Region XII – SOCCSKSARGEN</li>
									<li>
										Provinces, cities, and municipalities under the region
									</li>
									<li>Official BFP fire stations only</li>
								</ul>
								<Alert
									variant="destructive"
									className="mt-8 border-red-200 bg-red-50 text-red-900 dark:bg-red-900/10 dark:text-red-200"
								>
									<AlertTriangle className="h-5 w-5" />
									<AlertTitle className="font-bold">
										Restricted Access
									</AlertTitle>
									<AlertDescription>
										Cross-region access is not permitted. Accounts are not
										public.
									</AlertDescription>
								</Alert>
							</div>
						</motion.div>

						{/* Workflow */}
						<motion.div
							initial={{ opacity: 0, x: 50 }}
							whileInView={{ opacity: 1, x: 0 }}
							viewport={{ once: true, margin: "-100px" }}
							transition={{ duration: 0.8 }}
						>
							<div className="mb-8 flex items-center gap-3">
								<Truck className="h-8 w-8 text-red-600" />
								<h3 className="font-bold text-3xl">Operational Workflow</h3>
							</div>
							<div className="relative space-y-12 border-slate-200 border-l-2 pl-10 dark:border-slate-800">
								<WorkflowStep
									stepRole="Fire Station"
									action="Supply Officer creates request → Station Commander validates"
									delay={0}
								/>
								<WorkflowStep
									stepRole="Region"
									action="Regional Logistics Manager reviews and consolidates"
									delay={0.2}
								/>
								<WorkflowStep
									stepRole="Region"
									action="Regional Director approves or rejects. Final disposition recorded."
									delay={0.4}
								/>
							</div>
						</motion.div>
					</div>
				</div>
			</section>

			<Separator />

			{/* Security Notice */}
			<section className="relative z-20 py-24">
				<div className="container mx-auto max-w-4xl px-4">
					<motion.div
						initial={{ opacity: 0, scale: 0.95 }}
						whileInView={{ opacity: 1, scale: 1 }}
						viewport={{ once: true }}
						transition={{ duration: 0.5 }}
					>
						<Alert className="border-amber-200 bg-amber-50 text-amber-900 shadow-sm dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
							<ShieldAlert className="h-5 w-5" />
							<AlertTitle className="mb-2 font-bold text-lg">
								Notice & Disclaimer
							</AlertTitle>
							<AlertDescription className="text-base">
								This system is intended for official BFP use only. Unauthorized
								access, data misuse, or circumvention of procedures is subject
								to administrative and legal action under applicable laws and BFP
								regulations.
							</AlertDescription>
						</Alert>
					</motion.div>
				</div>
			</section>

			{/* Footer */}
			<footer className="relative z-20 border-white/10 border-t bg-slate-950/80 py-12 text-center text-slate-400 backdrop-blur-xl">
				<div className="container mx-auto px-4">
					<div className="mb-4 font-bold text-lg text-white">
						Bureau of Fire Protection – Region XII
					</div>
					<div className="text-sm">SOCCSKSARGEN</div>
					<div className="mt-8 text-xs opacity-60">
						For system access concerns, contact your Station Commander or
						Provincial Logistics Office.
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
		<motion.div variants={fadeInUp}>
			<Card className="h-full border-white/10 border-t-4 border-t-red-600 bg-black/40 text-slate-200 backdrop-blur-md transition-all hover:-translate-y-2 hover:bg-black/60 hover:shadow-2xl hover:shadow-red-900/20">
				<CardHeader>
					<div className="mb-6">{icon}</div>
					<CardTitle className="text-2xl">{title}</CardTitle>
				</CardHeader>
				<CardContent>
					<CardDescription className="text-lg leading-relaxed">
						{description}
					</CardDescription>
				</CardContent>
			</Card>
		</motion.div>
	);
}

function WorkflowStep({
	stepRole,
	action,
	delay,
}: {
	stepRole: string;
	action: string;
	delay: number;
}) {
	return (
		<motion.div
			initial={{ opacity: 0, x: -20 }}
			whileInView={{ opacity: 1, x: 0 }}
			viewport={{ once: true }}
			transition={{ duration: 0.5, delay }}
			className="relative rounded-2xl border border-white/5 bg-black/30 p-6 backdrop-blur-sm"
		>
			<span className="absolute top-8 -left-[54px] flex h-6 w-6 items-center justify-center rounded-full bg-red-600 shadow-md ring-4 ring-slate-950">
				<div className="h-2 w-2 rounded-full bg-white" />
			</span>
			<h4 className="mb-2 font-bold text-white text-xl">{stepRole}</h4>
			<p className="text-lg text-slate-300 leading-relaxed">{action}</p>
		</motion.div>
	);
}
