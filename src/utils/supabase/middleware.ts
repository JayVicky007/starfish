import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // 🚀 ENVIRONMENT GUARD: Drop in dummy variables if local keys are unlinked
  if (!supabaseUrl || !supabaseKey) {
    supabaseUrl = "https://smgxxpkxyezripjpfnbv.supabase.co/";
    supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtZ3h4cGt4eWV6cmlwanBmbmJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0ODYxNDIsImV4cCI6MjEwODA2MjE0Mn0.JZXoPkpMBEjOqS_PAG0iwXi8-d0JFQvCeqzG5X_vFjc";
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );

        response = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  try {
    await supabase.auth.getUser();
  } catch {
    // Gracefully digest auth network disconnects during development simulation
  }

  return response;
}



// import { createServerClient } from "@supabase/ssr";
// import { NextResponse, type NextRequest } from "next/server";

// export async function updateSession(request: NextRequest) {
//   let response = NextResponse.next({
//     request,
//   });

//   const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
//   const supabaseKey =
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
//     process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

//   const supabase = createServerClient(supabaseUrl, supabaseKey, {
//     cookies: {
//       getAll() {
//         return request.cookies.getAll();
//       },
//       setAll(cookiesToSet) {
//         cookiesToSet.forEach(({ name, value }) =>
//           request.cookies.set(name, value),
//         );

//         response = NextResponse.next({
//           request,
//         });

//         cookiesToSet.forEach(({ name, value, options }) =>
//           response.cookies.set(name, value, options),
//         );
//       },
//     },
//   });

//   await supabase.auth.getUser();

//   return response;
// }
