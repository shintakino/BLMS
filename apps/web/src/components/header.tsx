"use client";

import { motion } from "framer-motion";
import { Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { authClient } from "@/lib/auth-client";
import { ModeToggle } from "./mode-toggle";
import { Button } from "./ui/button";
import UserMenu from "./user-menu";

export default function Header() {
	const { data: session } = authClient.useSession();
	const pathname = usePathname();
	const isLoginPage = pathname === "/login" || pathname === "/change-password";

	// If we are on a dashboard page, we might ideally hide this header or render a different one.
	// However, per instructions, we are treating this as the "Public/Landing" header.
	// We will conditionally render the 'Login' button if not on login page.

	// Hide header on dashboard routes to allow DashboardLayout to handle navigation
	const authenticatedRoutes = [
		"/dashboard",
		"/requests",
		"/inventory",
		"/users",
		"/audit",
		"/settings",
		"/transfers",
		"/stations",
	];
	if (authenticatedRoutes.some((route) => pathname.startsWith(route))) {
		return null;
	}

	return (
		<motion.header
			initial={{ y: -100 }}
			animate={{ y: 0 }}
			transition={{ duration: 0.5 }}
			className="fixed top-0 right-0 left-0 z-50 border-white/10 border-b bg-slate-950/70 backdrop-blur-xl supports-[backdrop-filter]:bg-slate-950/50"
		>
			<div className="container mx-auto flex h-16 items-center justify-between px-4">
				{/* Logo & Branding */}
				{/* Logo & Branding */}
				<Link
					href="/"
					className="flex items-center gap-4 transition-opacity hover:opacity-80"
				>
					<div className="flex items-center gap-2">
						<div className="relative h-10 w-10 drop-shadow-md">
							<Image
								src="/images/bfpNationalLogo.png"
								alt="BFP National Logo"
								fill
								className="object-contain"
								priority
							/>
						</div>
						<div className="relative h-10 w-10 drop-shadow-md">
							<Image
								src="/images/bfpRegion12Logo.png"
								alt="BFP Region 12 Logo"
								fill
								className="object-contain"
								priority
							/>
						</div>
					</div>
					<div className="hidden flex-col md:flex">
						<span className="font-bold text-slate-100 text-sm leading-none tracking-tight">
							Bureau of Fire Protection
						</span>
						<span className="font-medium text-slate-400 text-xs leading-none">
							Region XII Logistics
						</span>
					</div>
				</Link>

				{/* Right Actions */}
				<div className="flex items-center gap-4">
					<nav className="hidden items-center gap-6 font-medium text-sm md:flex">
						<Link
							href="/"
							className={`transition-colors hover:text-red-500 ${pathname === "/" ? "text-red-500" : "text-slate-300"}`}
						>
							Home
						</Link>
						{/* Dashboard link removed as requested */}
					</nav>

					<div className="flex items-center gap-2 border-border/50 border-l pl-4">
						<ModeToggle />

						{/* Show Sign In button if not on login page and (implied) not logged in, 
                            but UserMenu handles logged-in state. 
                            We can keep UserMenu for authenticated users. 
                        */}
						<UserMenu />

						{/* Mobile Menu Trigger */}
						<div className="md:hidden">
							<MobileMenu isLoginPage={isLoginPage} session={session} />
						</div>

						{!isLoginPage && !session && (
							<div className="hidden md:block">
								<Link href="/login">
									<Button
										variant="ghost"
										size="sm"
										className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
									>
										Partner Access
									</Button>
								</Link>
							</div>
						)}
					</div>
				</div>
			</div>
		</motion.header>
	);
}

function MobileMenu({
	isLoginPage,
	session,
}: {
	isLoginPage: boolean;
	session: typeof authClient.$Infer.Session | null;
}) {
	const [open, setOpen] = useState(false);

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>
				<Button variant="ghost" size="icon" className="md:hidden">
					<Menu className="h-6 w-6" />
					<span className="sr-only">Toggle menu</span>
				</Button>
			</SheetTrigger>
			<SheetContent
				side="right"
				className="border-white/10 bg-slate-950/95 text-slate-200"
			>
				<SheetHeader>
					<SheetTitle className="text-white">Menu</SheetTitle>
				</SheetHeader>
				<div className="mt-8 flex flex-col gap-6">
					<nav className="flex flex-col gap-4 font-medium text-lg">
						<Link
							href="/"
							className="text-slate-300 transition-colors hover:text-red-500"
							onClick={() => setOpen(false)}
						>
							Home
						</Link>
						{!isLoginPage && !session && (
							<Link
								href="/login"
								className="text-slate-300 transition-colors hover:text-red-500"
								onClick={() => setOpen(false)}
							>
								Partner Access
							</Link>
						)}
					</nav>
					{session && (
						<div className="border-white/10 border-t pt-6">
							<Link href="/dashboard" onClick={() => setOpen(false)}>
								<Button className="w-full bg-red-600 text-white hover:bg-red-700">
									Go to Dashboard
								</Button>
							</Link>
						</div>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
}
