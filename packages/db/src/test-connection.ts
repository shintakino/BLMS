import dotenv from "dotenv";
import path from "path";
import pg from "pg";

// Load environment variables from apps/web/.env
const envPath = path.resolve(process.cwd(), "../../apps/web/.env");
dotenv.config({ path: envPath });

const rawUrl = process.env.DATABASE_URL;

if (!rawUrl) {
	console.error("❌ Error: DATABASE_URL is not set in apps/web/.env");
	process.exit(1);
}

const obfuscatedUrl = rawUrl.replace(/:[^:@]+@/, ":****@");
console.log(`Database Connection String: ${obfuscatedUrl}\n`);

async function runTest() {
	console.log("--- Test 1: Connecting using raw connection string ---");
	let client = new pg.Client({ connectionString: rawUrl });
	try {
		await client.connect();
		console.log(
			"✅ SUCCESS: Connected successfully using raw connection string!",
		);
		const res = await client.query("SELECT version();");
		console.log(`ℹ️ Postgres Version: ${res.rows[0].version}`);
		await client.end();
		return;
	} catch (err: any) {
		console.error(`❌ Failed raw connection: ${err.message}`);

		if (
			err.message.includes("password authentication failed") ||
			err.code === "28P01"
		) {
			console.log("\n💡 Troubleshooting Tip:");
			console.log(
				"The password provided in the connection string is incorrect.",
			);
			console.log(
				"Please double-check the password in your Supabase project settings.",
			);
			console.log(
				'If your password contains special characters (like "@"), they must be URL-encoded (e.g., "@" becomes "%40").',
			);
		} else if (
			err.message.includes("getaddrinfo") ||
			err.code === "ENOTFOUND"
		) {
			console.log("\n💡 Troubleshooting Tip:");
			console.log(
				"The host address cannot be resolved. Please verify your Supabase database host domain.",
			);
		}
	}

	console.log("\n--- Test 2: Connecting using URL-decoded password config ---");
	try {
		const parsedUrl = new URL(rawUrl);
		const decodedPassword = decodeURIComponent(parsedUrl.password);
		const decodedUsername = decodeURIComponent(parsedUrl.username);

		console.log("Attempting connection with decoded password...");
		client = new pg.Client({
			host: parsedUrl.hostname,
			port: Number(parsedUrl.port) || 5432,
			user: decodedUsername,
			password: decodedPassword,
			database: parsedUrl.pathname.substring(1),
			ssl:
				rawUrl.includes("supabase") || rawUrl.includes("neon")
					? { rejectUnauthorized: false }
					: undefined,
		});

		await client.connect();
		console.log(
			"✅ SUCCESS: Connected successfully using decoded password config!",
		);
		const res = await client.query("SELECT version();");
		console.log(`ℹ️ Postgres Version: ${res.rows[0].version}`);
		await client.end();
	} catch (err: any) {
		console.error(`❌ Failed config connection: ${err.message}`);
	}
}

runTest();
