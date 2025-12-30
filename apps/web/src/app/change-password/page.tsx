"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import ChangePasswordForm from "@/components/change-password-form";
import { useSession } from "@/lib/auth-client";

export default function ChangePasswordPage() {
	const { data: session, isPending } = useSession();
	const router = useRouter();

	useEffect(() => {
		if (!isPending && session?.user) {
			const user = session.user as { mustChangePassword?: boolean };
			if (!user.mustChangePassword) {
				router.replace("/dashboard");
			}
		}
	}, [session, isPending, router]);

	if (isPending) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		);
	}
	return (
		<div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
			<div className="w-full max-w-md space-y-8">
				<ChangePasswordForm />
			</div>
		</div>
	);
}
