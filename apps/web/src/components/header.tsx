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
		<header className="sticky top-0 z-50 w-full border-b border-foreground bg-background font-mono text-xs">
			<div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
				{/* Logo & Branding */}
				<Link href="/" className="flex items-center gap-4 hover:opacity-90">
					<div className="flex items-center gap-1.5">
						<div className="relative h-8 w-8">
							<Image src="/images/bfpNationalLogo.png" alt="BFP National Logo" fill className="object-contain" />
						</div>
						<div className="relative h-8 w-8">
							<Image src="/images/bfpRegion12Logo.png" alt="BFP Region 12 Logo" fill className="object-contain" />
						</div>
					</div>
					<div className="hidden flex-col md:flex">
						<span className="font-bold text-foreground leading-none tracking-wider uppercase">
							BLMS XII
						</span>
						<span className="font-bold text-[8px] text-muted-foreground uppercase leading-none mt-1">
							{"/// OPERATIONS PORTAL"}
						</span>
					</div>
				</Link>

				{/* Right Navigation */}
				<div className="flex items-center gap-6">
					<nav className="hidden items-center gap-6 md:flex">
						<Link
							href="/"
							className={`uppercase font-bold tracking-wider hover:text-primary ${pathname === "/" ? "text-primary underline decoration-2 underline-offset-4" : "text-muted-foreground"}`}
						>
							Home
						</Link>
					</nav>

					<div className="flex items-center gap-3 border-l border-border pl-4">
						<ModeToggle />
						<UserMenu />

						<div className="md:hidden">
							<MobileMenu isLoginPage={isLoginPage} session={session} />
						</div>

						{!isLoginPage && !session && (
							<div className="hidden md:block">
								<Link href="/login">
									<Button className="h-8 rounded-none border border-foreground bg-primary text-white font-bold text-[10px] uppercase shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] transition-all">
										PARTNER ACCESS
									</Button>
								</Link>
							</div>
						)}
					</div>
				</div>
			</div>
		</header>
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
			<SheetContent side="right" className="border-border bg-slate-950 font-mono text-xs text-slate-200">
				<SheetHeader>
					<SheetTitle className="text-white text-sm uppercase">Navigation Matrix</SheetTitle>
				</SheetHeader>
				<div className="mt-8 flex flex-col gap-6">
					<nav className="flex flex-col gap-4 font-bold text-sm uppercase">
						<Link href="/" className="text-slate-300 hover:text-red-500" onClick={() => setOpen(false)}>
							Home
						</Link>
						{!isLoginPage && !session && (
							<Link href="/login" className="text-slate-300 hover:text-red-500" onClick={() => setOpen(false)}>
								Partner Access
							</Link>
						)}
					</nav>
					{session && (
						<div className="border-t border-white/10 pt-6">
							<Link href="/dashboard" onClick={() => setOpen(false)}>
								<Button className="w-full bg-red-600 rounded-none text-white hover:bg-red-700 font-bold uppercase text-[10px]">
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
