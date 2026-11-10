import { redirect } from "next/navigation";
import AdminPostCategoryCorrections, {
  type AdminPost,
  type CorrectionHistoryEntry,
} from "@/components/AdminPostCategoryCorrections";
import { createClient } from "@/utils/supabase/server";

type ProfileSummary = {
  id: string;
  username: string | null;
  display_name: string | null;
};

export default async function AdminCorrectionsPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError && authError.name !== "AuthSessionMissingError") {
    throw new Error(authError.message);
  }
  if (!user) redirect("/login");

  const { data: posts, error: postsError } = await supabase
    .from("posts")
    .select("id, title, slug, status, category, author_id")
    .eq("status", "published")
    .order("updated_at", { ascending: false });
  if (postsError) throw new Error(postsError.message);

  const { data: history, error: historyError } = await supabase
    .from("post_category_changes")
    .select("id, post_id, actor_id, previous_category, new_category, reason, created_at")
    .order("created_at", { ascending: false })
    .limit(20);
  if (historyError) throw new Error(historyError.message);

  const authorIds = [...new Set((posts ?? []).map((post) => post.author_id))];
  const actorIds = [...new Set((history ?? [])
    .map((entry) => entry.actor_id)
    .filter((actorId): actorId is string => Boolean(actorId)))];
  const historyPostIds = [...new Set((history ?? []).map((entry) => entry.post_id))];

  const [authorsResult, actorsResult, historyPostsResult] = await Promise.all([
    authorIds.length
      ? supabase.from("profiles").select("id, username, display_name").in("id", authorIds)
      : Promise.resolve({ data: [], error: null }),
    actorIds.length
      ? supabase.from("profiles").select("id, username, display_name").in("id", actorIds)
      : Promise.resolve({ data: [], error: null }),
    historyPostIds.length
      ? supabase.from("posts").select("id, title").eq("status", "published").in("id", historyPostIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (authorsResult.error) throw new Error(authorsResult.error.message);
  if (actorsResult.error) throw new Error(actorsResult.error.message);
  if (historyPostsResult.error) throw new Error(historyPostsResult.error.message);

  const authorsById = new Map((authorsResult.data as ProfileSummary[]).map((profile) => [profile.id, profile]));
  const actorsById = new Map((actorsResult.data as ProfileSummary[]).map((profile) => [profile.id, profile]));
  const historyPostTitles = new Map((historyPostsResult.data ?? []).map((post) => [post.id, post.title]));

  const initialPosts: AdminPost[] = (posts ?? []).map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    status: post.status,
    category: post.category,
    author_id: post.author_id,
    author: authorsById.get(post.author_id) ?? null,
  }));
  const initialHistory: CorrectionHistoryEntry[] = (history ?? []).map((entry) => ({
    ...entry,
    post_title: historyPostTitles.get(entry.post_id) ?? "Deleted post",
    actor_name: actorsById.get(entry.actor_id ?? "")?.display_name ||
      (actorsById.get(entry.actor_id ?? "")?.username
        ? `@${actorsById.get(entry.actor_id ?? "")?.username}`
        : "Former admin"),
  }));

  return (
    <AdminPostCategoryCorrections
      initialPosts={initialPosts}
      initialHistory={initialHistory}
    />
  );
}
