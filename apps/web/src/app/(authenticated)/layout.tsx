"use client";

import { AppSidebar, MobileSidebar } from "@/components/app-sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import UserMenu from "@/components/user-menu";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="flex min-h-screen flex-col md:flex-row">
			{/* Desktop Sidebar */}
			<aside className="fixed inset-y-0 z-50 hidden w-64 flex-col md:flex">
				<AppSidebar />
			</aside>

			{/* Main Content */}
			<main className="flex-1 md:ml-64">
				{/* Mobile / Tablet Header */}
				<header className="sticky top-0 z-40 flex h-16 items-center border-b bg-background px-4 md:hidden">
					<MobileSidebar />
					<span className="ml-4 font-semibold">BFP Logistics</span>
					<div className="ml-auto flex items-center gap-2">
						<ModeToggle />
						<UserMenu />
					</div>
				</header>

				{/* Desktop Header Actions (Optional - e.g. Breadcrumbs or just UserMenu top right) */}
				{/* Since Sidebar already has User Info at bottom, we might not need top right menu on desktop. 
                    However, standard pattern often has top-right user menu. 
                    Our Sidebar has User Info at bottom. Let's keep it simple. */}
				<div className="hidden justify-end border-b p-4 md:flex">
					<div className="flex items-center gap-2">
						<ModeToggle />
						<UserMenu />
					</div>
				</div>

				<div className="p-4 md:p-8">{children}</div>
			</main>
		</div>
	);
}
