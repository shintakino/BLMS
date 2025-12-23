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
import Link from "next/link";

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

// Ember Particle Effect Component
const EmberParticles = () => {
	// Generate static random values for hydration consistency
	const particles = Array.from({ length: 20 }).map((_, i) => ({
		id: i,
		left: `${(i * 5) % 100}%`,
		duration: 3 + (i % 5),
		delay: i * 0.2,
	}));

	return (
		<div className="pointer-events-none absolute inset-0 overflow-hidden">
			{particles.map((particle) => (
				<motion.div
					key={particle.id}
					className="absolute bottom-0 h-1 w-1 rounded-full bg-red-500 opacity-0"
					style={{ left: particle.left }}
					animate={{
						y: [0, -400],
						x: [0, particle.id % 2 === 0 ? 50 : -50],
						opacity: [0, 1, 0],
						scale: [0, 1.5, 0],
					}}
					transition={{
						duration: particle.duration,
						repeat: Number.POSITIVE_INFINITY,
						ease: "easeOut",
						delay: particle.delay,
					}}
				/>
			))}
		</div>
	);
};

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

	// Parallax Effects
	const heroBgY = useTransform(scrollY, [0, 1000], [0, 400]);
	const heroTextY = useTransform(scrollY, [0, 500], [0, 100]); // Subtle shift for text
	const embersY = useTransform(scrollY, [0, 1000], [0, 200]); // Embers move at different speed

	return (
		<div className="min-h-screen overflow-x-hidden bg-background text-foreground">
			{/* Hero Section */}
			<section className="relative h-screen min-h-[800px] overflow-hidden bg-slate-950 text-white">
				<motion.div
					style={{ y: heroBgY }}
					className="absolute inset-0 z-0 opacity-20"
				>
					{/* Abstract background pattern */}
					<svg
						className="h-[120%] w-full"
						viewBox="0 0 100 100"
						preserveAspectRatio="none"
						aria-labelledby="hero-pattern-title"
					>
						<title id="hero-pattern-title">Abstract background pattern</title>
						<path d="M0 100 L100 0 L100 100 Z" fill="url(#grad1)" />
						<defs>
							<linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
								<stop
									offset="0%"
									style={{ stopColor: "rgb(200,0,0)", stopOpacity: 1 }}
								/>
								<stop
									offset="100%"
									style={{ stopColor: "rgb(0,0,0)", stopOpacity: 1 }}
								/>
							</linearGradient>
						</defs>
					</svg>
				</motion.div>

				{/* Fire Animation Effect with Parallax */}
				<motion.div style={{ y: embersY }} className="absolute inset-0 z-0">
					<EmberParticles />
				</motion.div>

				<motion.div
					style={{ y: heroTextY }}
					className="container relative z-10 mx-auto flex h-full flex-col items-center justify-center px-4 text-center"
					initial="hidden"
					animate="visible"
					variants={staggerContainer}
				>
					<motion.div variants={fadeInUp} className="mb-6 flex justify-center">
						<Badge
							variant="destructive"
							className="px-4 py-1 font-semibold text-sm uppercase tracking-wider shadow-lg shadow-red-900/50"
						>
							Restricted • Official Use Only
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
						<Link href="/login">
							<Button
								size="lg"
								className="bg-red-600 px-8 py-6 font-semibold text-lg shadow-red-900/20 shadow-xl transition-all hover:scale-105 hover:bg-red-700"
							>
								Login to System
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
						className="absolute bottom-10 left-1/2 -translate-x-1/2 text-slate-500"
					>
						<div className="flex flex-col items-center gap-2">
							<span className="text-xs uppercase tracking-widest">Scroll</span>
							<div className="h-10 w-[1px] bg-gradient-to-b from-slate-500 to-transparent" />
						</div>
					</motion.div>
				</motion.div>
			</section>

			{/* System Purpose */}
			<section className="relative z-20 bg-slate-50 py-24 dark:bg-slate-900">
				<div className="container mx-auto max-w-5xl px-4">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-100px" }}
						transition={{ duration: 0.6 }}
						className="mb-16 text-center"
					>
						<h2 className="mb-4 font-bold text-4xl text-slate-900 dark:text-white">
							System Purpose
						</h2>
						<p className="mx-auto max-w-2xl text-lg text-slate-600 dark:text-slate-400">
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
							<div className="space-y-6 text-lg text-slate-600 dark:text-slate-400">
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
			<section className="relative z-20 bg-slate-50/50 py-24">
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
			<footer className="relative z-20 bg-slate-950 py-12 text-center text-slate-400">
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
			<Card className="h-full border-t-4 border-t-red-600 transition-all hover:-translate-y-2 hover:shadow-2xl">
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
			className="relative"
		>
			<span className="absolute -left-[49px] flex h-6 w-6 items-center justify-center rounded-full bg-red-600 shadow-md ring-4 ring-white dark:ring-slate-950">
				<div className="h-2 w-2 rounded-full bg-white" />
			</span>
			<h4 className="mb-1 font-bold text-xl">{stepRole}</h4>
			<p className="text-lg text-slate-600 leading-relaxed dark:text-slate-400">
				{action}
			</p>
		</motion.div>
	);
}
