import { sql } from "drizzle-orm";
import { db } from "./index";

async function main() {
	console.log("🔒 Applying Storage RLS Policies...");

	try {
		// 1. Enable RLS on storage.objects
		await db.execute(
			sql`alter table storage.objects enable row level security;`,
		);
		console.log("✅ RLS enabled on storage.objects");

		// 2. Policy: Authenticated users can upload to 'attachments' bucket
		// Drop if exists to avoid error
		await db.execute(
			sql`drop policy if exists "Authenticated users can upload attachments" on storage.objects;`,
		);
		await db.execute(sql`
            create policy "Authenticated users can upload attachments"
            on storage.objects for insert
            to authenticated
            with check ( bucket_id = 'attachments' );
        `);
		console.log("✅ Upload policy applied");

		// 3. Policy: Authenticated users can select (view) from 'attachments' bucket (needed for client-side getPublicUrl if public, but we are private)
		// Since we are using Private bucket, we don't strictly need SELECT policy if we use Service Role to generate Signed URLs.
		// BUT, if the frontend tries to list files or view them directly, it might fail.
	} catch (error) {
		console.error("❌ Failed to apply policies:", error);
		process.exit(1);
	}

	console.log("✅ Policies applied successfully!");
	process.exit(0);
}

main();
