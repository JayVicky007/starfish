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
    const fallbackUrl = "https://smgxxpkxyezripjpfnbv.supabase.co/";
    const fallbackKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtZ3h4cGt4eWV6cmlwanBmbmJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0ODYxNDIsImV4cCI6MjEwODA2MjE0Mn0.JZXoPkpMBEjOqS_PAG0iwXi8-d0JFQvCeqzG5X_vFjc";
    return createBrowserClient(fallbackUrl, fallbackKey);
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}
