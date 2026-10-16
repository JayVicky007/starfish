// import { createBrowserClient } from "@supabase/ssr";

// export function createClient() {
//   const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
//   const supabaseKey =
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
//     process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

//   return createBrowserClient(supabaseUrl, supabaseKey);
// }

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // 🚀 HARDEN BUILD CONTROLLER against missing or unlinked system variables
  if (!supabaseUrl || !supabaseKey) {
    const fallbackUrl = "https://supabase.co";
    const fallbackKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mocksecretkey";
    return createBrowserClient(fallbackUrl, fallbackKey);
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}
