import dotenv from "dotenv";
import path from "path";
import pg from "pg";
import { fileURLToPath } from "url";

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../../../apps/web/.env");
dotenv.config({ path: envPath });

const rawUrl = process.env.DATABASE_URL;

if (!rawUrl) {
	console.error("❌ Error: DATABASE_URL is not set in apps/web/.env");
	process.exit(1);
}

async function resetDatabase() {
	console.log(
		"⚠️ WARNING: This will completely WIPE all data, tables, and custom enum types in the public schema of the target database.",
	);
	console.log("Proceeding with database reset...");

	const client = new pg.Client({ connectionString: rawUrl });

	try {
		await client.connect();
		console.log("🔌 Connected to database. Executing wipe queries...");

		// SQL script to drop all tables and custom types safely
		const wipeQuery = `
			DO $$ DECLARE
				r RECORD;
			BEGIN
				-- 1. Drop all views
				FOR r IN (SELECT viewname FROM pg_views WHERE schemaname = 'public') LOOP
					EXECUTE 'DROP VIEW IF EXISTS public.' || quote_ident(r.viewname) || ' CASCADE';
				END LOOP;

				-- 2. Drop all tables
				FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
					EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
				END LOOP;
				
				-- 3. Drop all custom types (enums)
				FOR r IN (SELECT typname FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typtype = 'e') LOOP
					EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.typname) || ' CASCADE';
				END LOOP;
			END $$;
		`;

		await client.query(wipeQuery);
		console.log("🗑️ Database successfully wiped clean!");

		console.log("\n💡 Next steps to recreate and seed database structure:");
		console.log("1. Push the schema structure: npm run db:push");
		console.log(
			"2. Seed geographic & station nodes: npx tsx packages/db/src/seed.ts",
		);
		console.log("3. Seed users: npx tsx packages/auth/src/seed-test-users.ts");
		console.log(
			"4. Setup Supabase Storage buckets: npx tsx packages/db/src/seed-buckets.ts",
		);
	} catch (err: any) {
		console.error("❌ Reset failed:", err.message);
	} finally {
		await client.end();
		process.exit(0);
	}
}

resetDatabase();
