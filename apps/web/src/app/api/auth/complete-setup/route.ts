import { auth } from "@BLMS/auth";
import { db } from "@BLMS/db";
import { user } from "@BLMS/db/schema/auth";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(_req: Request) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		return new NextResponse("Unauthorized", { status: 401 });
	}

	// Set mustChangePassword to false
	await db
		.update(user)
		.set({ mustChangePassword: false })
		.where(eq(user.id, session.user.id));

	return new NextResponse("OK", { status: 200 });
}
