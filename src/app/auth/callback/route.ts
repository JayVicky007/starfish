import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");
  const redirectTo = next?.startsWith("/") && !next.startsWith("//") && !next.includes("\\")
    ? new URL(next, url.origin)
    : new URL("/", url.origin);
  const isPasswordReset = redirectTo.pathname === "/reset-password/update";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const errorRedirect = isPasswordReset
        ? redirectTo
        : new URL("/login", url.origin);
      errorRedirect.searchParams.set("error", "link_invalid");
      return NextResponse.redirect(errorRedirect);
    }
  } else if (isPasswordReset || url.searchParams.has("error")) {
    const errorRedirect = isPasswordReset
      ? redirectTo
      : new URL("/login", url.origin);
    errorRedirect.searchParams.set("error", "link_invalid");
    return NextResponse.redirect(errorRedirect);
  }

  return NextResponse.redirect(redirectTo);
}
