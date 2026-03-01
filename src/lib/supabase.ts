import { createClient } from "@supabase/supabase-js";

// Ensure these exist in your .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
// Using the service role key on the backend allows bypassing Row Level Security (RLS) safely
// because our API routes validate the user role and session before executing any queries.
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
