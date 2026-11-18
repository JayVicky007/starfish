import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicKey, getSupabaseUrl } from "@/utils/supabase/config";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("CRON_SECRET is not configured.");
    return Response.json(
      { error: "Cron secret is not configured." },
      { status: 500 },
    );
  }

  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(getSupabaseUrl(), getSupabasePublicKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { error } = await supabase
    .from("posts")
    .select("id")
    .eq("status", "published")
    .limit(1);

  if (error) {
    console.error("Supabase keepalive query failed.", error);
    return Response.json(
      { error: "Supabase keepalive query failed." },
      { status: 502 },
    );
  }

  return Response.json({ ok: true });
}
