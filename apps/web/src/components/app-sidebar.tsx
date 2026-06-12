"use client";

import {
	FileCheck,
	FilePlus,
	LayoutDashboard,
	Menu,
	Package,
	Settings,
	Truck,
	Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import UserMenu from "@/components/user-menu";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

interface SidebarProps {
	className?: string;
}

export function AppSidebar({ className }: SidebarProps) {
	const pathname = usePathname();
	const { data: session } = authClient.useSession();
	// biome-ignore lint/suspicious/noExplicitAny: complex role type
	const role = (session?.user as any)?.role;

	if (!session) return null;

	const links = getLinksByRole(role);

	return (
		<div className={cn("h-screen border-r border-white/10 bg-slate-950/80 pb-12 font-mono text-xs crt-scanline", className)}>
			<div className="space-y-4 py-4">
				<div className="px-3 py-2">
					<div className="mb-6 flex items-center gap-3 px-4">
						<div className="relative h-8 w-8 shrink-0">
							{/* biome-ignore lint/performance/noImgElement: local asset */}
							<img
								src="/images/bfpRegion12Logo.png"
								alt="BFP Logo"
								className="h-full w-full object-contain"
							/>
						</div>
						<div className="flex flex-col">
							<span className="font-bold text-white uppercase tracking-wider text-[10px]">
								BLMS COMMAND
							</span>
							<span className="font-bold text-[8px] text-red-500 uppercase">
								{"/// SYSTEM TERMINAL"}
							</span>
						</div>
					</div>
					<div className="space-y-1">
						{links.map((link) => (
							// biome-ignore lint/suspicious/noExplicitAny: href dynamic type mismatch with nextjs typed routes
							<Link key={link.href} href={link.href as any}>
								<Button
									variant={pathname === link.href ? "secondary" : "ghost"}
									className={cn(
										"w-full justify-start rounded-none text-xs uppercase tracking-wider",
										pathname === link.href 
											? "bg-red-950/20 text-red-400 border-l-2 border-red-600 font-bold" 
											: "text-slate-400 hover:text-slate-200 hover:bg-white/5"
									)}
								>
									<link.icon className="mr-2 h-4 w-4" />
									{link.label}
								</Button>
							</Link>
						))}
					</div>
				</div>

				{/* Bottom Section */}
				<div className="absolute bottom-4 w-full px-4">
					{/* User Profile */}
					<div className="flex items-center justify-between rounded-none border border-white/10 bg-slate-950/90 p-2">
						<div className="flex items-center gap-2 overflow-hidden">
							<div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-none border border-white/20 bg-slate-900">
								{session.user.image ? (
									/* biome-ignore lint/performance/noImgElement: user avatar */
									<img
										src={session.user.image}
										alt={session.user.name}
										className="h-full w-full object-cover"
									/>
								) : (
									<span className="font-bold text-xs text-red-500">
										{session.user.name.charAt(0)}
									</span>
								)}
							</div>
							<div className="flex-1 overflow-hidden">
								<p className="truncate font-bold text-slate-200 uppercase text-[10px]">
									{session.user.name}
								</p>
								<p className="truncate text-red-400 text-[8px] uppercase tracking-wider">
									{role?.replace(/-/g, " ")}
								</p>
							</div>
						</div>
						{/* We use the UserMenu for the dropdown actions (Logout, etc) */}
						<UserMenu />
					</div>
				</div>
			</div>
		</div>
	);
}

// Mobile Sidebar Wrapper
export function MobileSidebar() {
	return (
		<Sheet>
			<SheetTrigger className="p-2 md:hidden">
				<Menu className="h-5 w-5 text-slate-300" />
				<span className="sr-only">Toggle Menu</span>
			</SheetTrigger>
			<SheetContent
				side="left"
				className="w-[80%] max-w-[300px] bg-slate-950 border-r border-white/10 p-0 text-slate-200 font-mono"
			>
				<SheetHeader className="border-b border-white/10 px-6 py-4">
					<SheetTitle className="text-white text-xs uppercase tracking-wider">BLMS COMMAND</SheetTitle>
				</SheetHeader>
				<AppSidebar className="border-none" />
			</SheetContent>
		</Sheet>
	);
}

function getLinksByRole(role: string) {
	const common = [
		{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
	];

	switch (role) {
		case "supply-officer":
			return [
				...common,
				{ href: "/requests/new", label: "Create Request", icon: FilePlus },
				{ href: "/inventory", label: "My Inventory", icon: Package },
			];
		case "station-commander":
			return [
				...common,
				{ href: "/inventory", label: "Station Inventory", icon: Package },
				{ href: "/transfers", label: "Asset Transfers", icon: Truck }, // T-041 (if page exists)
			];
		case "regional-logistics-manager":
			return [
				...common,
				{ href: "/inventory", label: "Regional Inventory", icon: Package },
				{ href: "/stations", label: "Stations", icon: Users }, // Future
			];
		case "regional-director":
			return [
				...common,
				{ href: "/inventory", label: "Regional Inventory", icon: Package },
			];
		case "regional-admin":
			return [
				...common,
				{ href: "/users", label: "User Management", icon: Users },
				{ href: "/audit", label: "Audit Logs", icon: FileCheck },
				{ href: "/settings", label: "Settings", icon: Settings },
			];
		default:
			return common;
	}
}
