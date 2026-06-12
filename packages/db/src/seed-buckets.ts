import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../../../apps/web/.env");
dotenv.config({ path: envPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
	console.error("Missing Supabase URL or Service Role Key");
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function createBuckets() {
	console.log("🪣 Configuring Supabase Storage buckets...");

	const buckets = ["attachments"];

	for (const bucket of buckets) {
		const { data, error } = await supabase.storage.getBucket(bucket);

		if (error?.message.includes("not found")) {
			console.log(`Creating bucket: ${bucket}`);
			const { error: createError } = await supabase.storage.createBucket(
				bucket,
				{
					public: false, // Private bucket, require signed URLs or authenticated access
					fileSizeLimit: 5242880, // 5MB
					allowedMimeTypes: ["image/*", "application/pdf"],
				},
			);

			if (createError) {
				console.error(`Failed to create bucket ${bucket}:`, createError);
			} else {
				console.log(`✅ Bucket created: ${bucket}`);
			}
		} else if (data) {
			console.log(`ℹ️ Bucket already exists: ${bucket}`);
		} else {
			console.error(`Error checking bucket ${bucket}:`, error);
		}
	}
}

createBuckets();
