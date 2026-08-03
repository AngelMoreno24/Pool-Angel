import dotenv from "dotenv";
dotenv.config();

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(
  supabaseUrl || "http://127.0.0.1:54321",
  supabaseAnonKey || "dummy-anon-key"
);

export const adminSupabase = supabaseServiceRoleKey
  ? createClient(supabaseUrl || "http://127.0.0.1:54321", supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

export default supabase;