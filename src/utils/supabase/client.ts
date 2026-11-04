import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicKey, getSupabaseUrl } from "@/utils/supabase/config";

export function createClient() {
  return createBrowserClient(getSupabaseUrl(), getSupabasePublicKey());
}
