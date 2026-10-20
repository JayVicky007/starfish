import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // 🚀 ENVIRONMENT GUARD: Drop in dummy variables if local keys are unlinked
  if (!supabaseUrl || !supabaseKey) {
    supabaseUrl = "https://smgxxpkxyezripjpfnbv.supabase.co/";
    supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtZ3h4cGt4eWV6cmlwanBmbmJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0ODYxNDIsImV4cCI6MjEwODA2MjE0Mn0.JZXoPkpMBEjOqS_PAG0iwXi8-d0JFQvCeqzG5X_vFjc";
  }

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Digest cookie allocation side-effects in server component environments
        }
      },
    },
  });
}



// import { createServerClient } from "@supabase/ssr";
// import { cookies } from "next/headers";

// export async function createClient() {
//   const cookieStore = await cookies();
//   const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
//   const supabaseKey =
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
//     process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

//   return createServerClient(supabaseUrl, supabaseKey, {
//     cookies: {
//       getAll() {
//         return cookieStore.getAll();
//       },
//       setAll(cookiesToSet) {
//         try {
//           cookiesToSet.forEach(({ name, value, options }) =>
//             cookieStore.set(name, value, options),
//           );
//         } catch {
//         }
//       },
//     },
//   });
// }
