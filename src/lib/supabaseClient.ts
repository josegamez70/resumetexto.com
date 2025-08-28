import { createClient } from "@supabase/supabase-js";

const url = process.env.REACT_APP_SUPABASE_URL!;
const anon = process.env.REACT_APP_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, anon, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

if (process.env.NODE_ENV !== "production") {
  (window as any).supabase = supabase;
}
