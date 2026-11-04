import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl } from "@/utils/supabase/config";

export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error("Set SUPABASE_SERVICE_ROLE_KEY on the server.");
  }

  return createClient(getSupabaseUrl(), serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
