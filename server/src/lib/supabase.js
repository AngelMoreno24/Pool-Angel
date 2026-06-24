import dotenv from "dotenv";
dotenv.config();

console.log("URL:", process.env.SUPABASE_URL);
console.log("Key exists:", !!process.env.SUPABASE_ANON_KEY);

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default supabase;