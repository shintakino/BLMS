"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";

export default function PasswordChangeGuard({
	children,
}: {
	children: React.ReactNode;
}) {
	const { data: session, isPending } = useSession();
	const router = useRouter();
	const pathname = usePathname();

	useEffect(() => {
		if (isPending) return;

		if (
			(session?.user as { mustChangePassword?: boolean })?.mustChangePassword &&
			pathname !== "/change-password" &&
			// Allow logout to prevent loop if they want to switch accounts
			pathname !== "/api/auth/sign-out"
		) {
			toast.warning("You must change your password before proceeding.");
			router.push("/change-password");
		}
	}, [session, isPending, pathname, router]);

	return <>{children}</>;
}
