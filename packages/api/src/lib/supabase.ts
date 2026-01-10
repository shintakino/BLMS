import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Use Service Key for backend operations to bypass RLS when needed (e.g. creating signed URLs for others)
// OR usage of standard key if we rely on RLS.
// For "Get Request" -> we are authorizing via our own logic, then granting access via Signed URL.
// So Service Role is appropriate here.
export const supabaseAdmin =
	supabaseUrl && supabaseServiceKey
		? createClient(supabaseUrl, supabaseServiceKey)
		: null;
