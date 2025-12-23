"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ModeToggle } from "./mode-toggle";
import { Button } from "./ui/button";
import UserMenu from "./user-menu";

export default function Header() {
	const pathname = usePathname();
	const isLoginPage = pathname === "/login" || pathname === "/change-password";

	// If we are on a dashboard page, we might ideally hide this header or render a different one.
	// However, per instructions, we are treating this as the "Public/Landing" header.
	// We will conditionally render the 'Login' button if not on login page.

	return (
		<motion.header
			initial={{ y: -100 }}
			animate={{ y: 0 }}
			transition={{ duration: 0.5 }}
			className="fixed top-0 right-0 left-0 z-50 border-border/40 border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60"
		>
			<div className="container mx-auto flex h-16 items-center justify-between px-4">
				{/* Logo & Branding */}
				<Link
					href="/"
					className="flex items-center gap-3 transition-opacity hover:opacity-80"
				>
					<div className="relative h-10 w-10 overflow-hidden drop-shadow-md">
						<Image
							src="/images/Bureau_of_Fire_Protection.png"
							alt="BFP Logo"
							fill
							className="object-contain"
							priority
						/>
					</div>
					<div className="hidden flex-col md:flex">
						<span className="font-bold text-sm leading-none tracking-tight">
							Bureau of Fire Protection
						</span>
						<span className="font-medium text-muted-foreground text-xs leading-none">
							Region XII Logistics
						</span>
					</div>
				</Link>

				{/* Right Actions */}
				<div className="flex items-center gap-4">
					<nav className="hidden items-center gap-6 font-medium text-sm md:flex">
						<Link
							href="/"
							className={`transition-colors hover:text-red-600 ${pathname === "/" ? "text-red-600" : "text-foreground/60"}`}
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

						{!isLoginPage && (
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
