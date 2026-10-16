// import AdminPostCorrections from "@/components/AdminPostCorrections";
// import { createClient } from "@/utils/supabase/server";

// export default async function AdminCorrectionsPage() {
//   const supabase = await createClient();
//   const [{ data: posts, error: postsError }, { data: history, error: historyError }] = await Promise.all([
//     supabase
//       .from("posts")
//       .select("id, title, slug, status, media_type, tmdb_id, author_id, author:profiles!posts_author_id_fkey(username, display_name)")
//       .order("updated_at", { ascending: false }),
//     supabase
//       .from("post_metadata_corrections")
//       .select("id, post_id, post_title, actor_id, previous_media_type, new_media_type, previous_tmdb_id, new_tmdb_id, reason, created_at")
//       .order("created_at", { ascending: false })
//       .limit(20),
//   ]);
//   if (postsError) throw new Error(postsError.message);
//   if (historyError) throw new Error(historyError.message);

//   const actorIds = [...new Set((history ?? [])
//     .map((entry) => entry.actor_id)
//     .filter((actorId): actorId is string => Boolean(actorId)))];
//   const { data: actors, error: actorsError } = actorIds.length
//     ? await supabase
//       .from("profiles")
//       .select("id, username, display_name")
//       .in("id", actorIds)
//     : { data: [], error: null };
//   if (actorsError) throw new Error(actorsError.message);

//   const actorNameById = new Map((actors ?? []).map((actor) => [
//     actor.id,
//     actor.display_name || actor.username || "FilmShift admin",
//   ]));

//   return (
//     <AdminPostCorrections
//       initialPosts={posts ?? []}
//       initialHistory={(history ?? []).map((entry) => ({
//         ...entry,
//         actor_name: entry.actor_id
//           ? actorNameById.get(entry.actor_id) ?? "Former admin"
//           : "Former admin",
//       }))}
//     />
//   );
// }


"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Shield, Tag, History, Search, AlertCircle, CheckCircle2, Info } from "lucide-react";

export type MediaType = "saas" | "ai" | "devops" | "design" | "general";

export type AdminPost = {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  media_type: string | null;
  tmdb_id: number | null; // Kept as general metadata slot for external linkages
  author_id: string;
  author:

    | { username: string | null; display_name: string | null }
    | Array<{ username: string | null; display_name: string | null }>
    | null;
};

export type CorrectionHistoryEntry = {
  id: string;
  post_id: string;
  post_title: string;
  actor_id: string | null;
  previous_media_type: string | null;
  new_media_type: string;
  previous_tmdb_id: number | null;
  new_tmdb_id: number | null;
  reason: string;
  created_at: string;
  actor_name: string;
};

export type CorrectionResult = {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  media_type: MediaType;
  tmdb_id: number | null;
  author_id: string;
  previous_media_type: string | null;
  previous_tmdb_id: number | null;
  reason: string;
  corrected_at: string;
};

export const topicLabels: Record<string, string> = {
  saas: "SaaS & Architecture",
  ai: "AI & Automation",
  devops: "DevOps & Infosec",
  design: "Design Systems",
  general: "General / Other",
};

export function formatTopicType(value: string | null): string {
  if (!value) return "Unassigned Taxonomy";
  return topicLabels[value] || value;
}

export function formatAuditDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function isCorrectionResult(value: unknown): value is CorrectionResult {
  if (!value || typeof value !== "object") return false;
  const result = value as Record<string, unknown>;
  return typeof result.id === "string" &&
    typeof result.title === "string" &&
    typeof result.slug === "string" &&
    (result.status === "draft" || result.status === "published") &&
    (result.media_type === "saas" || result.media_type === "ai" || result.media_type === "devops" || result.media_type === "design" || result.media_type === "general") &&
    (result.tmdb_id === null || typeof result.tmdb_id === "number") &&
    typeof result.author_id === "string" &&
    (result.previous_media_type === null || typeof result.previous_media_type === "string") &&
    (result.previous_tmdb_id === null || typeof result.previous_tmdb_id === "number") &&
    typeof result.reason === "string" &&
    typeof result.corrected_at === "string";
}

function PostCorrectionCard({
  post,
  onCorrected,
}: {
  post: AdminPost;
  onCorrected: (correction: CorrectionResult) => void;
}) {
  const supabase = createClient();
  const [mediaType, setMediaType] = useState<MediaType | "">(
    post.media_type === "saas" || post.media_type === "ai" || post.media_type === "devops" || post.media_type === "design" || post.media_type === "general"
      ? post.media_type as MediaType
      : "",
  );
  const [tmdbId, setTmdbId] = useState(post.tmdb_id?.toString() ?? "");
  const [reason, setReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const isDirty =
    (mediaType !== "" && mediaType !== post.media_type) ||
    (mediaType === "" && post.media_type !== "saas" && post.media_type !== "ai" && post.media_type !== "devops" && post.media_type !== "design" && post.media_type !== "general") ||
    (mediaType === "general" ? null : (tmdbId.trim() ? Number(tmdbId) : null)) !== post.tmdb_id;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isDirty || isSaving || !mediaType) return;

    const normalizedTmdbId = mediaType === "general" || !tmdbId.trim() ? null : Number(tmdbId);
    if (normalizedTmdbId !== null && (!Number.isSafeInteger(normalizedTmdbId) || normalizedTmdbId <= 0)) {
      setErrorMessage("Enter a positive whole-number structural ID metadata index.");
      return;
    }
    if (reason.trim().length < 10 || reason.trim().length > 500) {
      setErrorMessage("Explain the structural classification change in 10 to 500 characters.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    setMessage("");

    try {
      const { data, error } = await supabase.rpc("admin_correct_post_metadata", {
        p_post_id: post.id,
        p_media_type: mediaType,
        p_tmdb_id: normalizedTmdbId,
        p_reason: reason.trim(),
      });

      if (error) {
        setErrorMessage(`Unable to correct this publication category index: ${error.message}`);
      } else {
        const result = Array.isArray(data) ? data[0] : data;
        if (!isCorrectionResult(result)) {
          setErrorMessage("The administrative modification routine completed without returning valid schema details.");
        } else {
          onCorrected(result);
          setTmdbId(normalizedTmdbId?.toString() ?? "");
          setReason("");
          setMessage("Article structural categorization updated successfully. Author sync event dispatched.");
        }
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? `Unexpected execution fault: ${error.message}` : "Unexpected mutation pipeline disconnect.");
    } finally {
      setIsSaving(false);
    }
  }

  const author = Array.isArray(post.author) ? post.author[0] : post.author;
  const authorName = author?.display_name || author?.username || "Unknown platform developer";

    return (
    <article className="rounded-2xl border border-text-muted/15 bg-background/60 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-bold text-foreground text-base tracking-tight">{post.title}</h3>
          <p className="mt-1 text-xs text-text-muted">
            By {authorName} · {post.status === "published" ? "Published Live" : "Private Draft"}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
          post.status === "published"
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            : "bg-text-muted/10 text-text-muted"
        }`}>
          {post.status}
        </span>
      </div>
      <p className="mt-3 text-xs text-text-muted">
        Current Classification: <span className="font-semibold text-foreground">{formatTopicType(post.media_type)}</span>
        {post.tmdb_id ? ` · External Metaindex #${post.tmdb_id}` : " · No linked index mapping"}
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-bold text-text-muted uppercase tracking-wider block">
            Correct Topic Sector
            <select
              value={mediaType}
              onChange={(event) => {
                const nextType = event.target.value as MediaType | "";
                setMediaType(nextType);
                if (nextType === "general") setTmdbId("");
                setMessage("");
                setErrorMessage("");
              }}
              className="mt-1.5 w-full rounded-xl border border-text-muted/20 bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            >
              <option value="" disabled>Select corrected taxonomy sector</option>
              {Object.entries(topicLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-bold text-text-muted uppercase tracking-wider block">
            Structural Index Mapping <span className="font-normal text-text-muted">(optional)</span>
            <input
              type="number"
              min="1"
              step="1"
              value={mediaType === "general" ? "" : tmdbId}
              disabled={mediaType === "general"}
              onChange={(event) => {
                setTmdbId(event.target.value);
                setMessage("");
                setErrorMessage("");
              }}
              placeholder="e.g. Related product index ID"
              className="mt-1.5 w-full rounded-xl border border-text-muted/20 bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent disabled:opacity-40 disabled:cursor-not-allowed"
            />
          </label>
        </div>
        
        <label className="block text-xs font-bold text-text-muted uppercase tracking-wider">
          Reason for Modification <span className="font-normal normal-case text-text-muted">(visible to author workflow notifications)</span>
          <textarea
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              setMessage("");
              setErrorMessage("");
            }}
            minLength={10}
            maxLength={500}
            rows={2}
            required
            placeholder="Explain why this content belongs in a different knowledge sector..."
            className="mt-1.5 w-full resize-y rounded-xl border border-text-muted/20 bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          />
          <span className="mt-1 block text-right text-[10px] font-medium text-text-muted">{reason.length}/500</span>
        </label>
        
        {errorMessage && <p role="alert" className="text-xs font-semibold text-rose-500 bg-rose-500/5 p-2 rounded-lg border border-rose-500/10">{errorMessage}</p>}
        {message && <p role="status" className="text-xs font-semibold text-emerald-500 bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10">{message}</p>}
        
        <button
          type="submit"
          disabled={!isDirty || isSaving}
          className="rounded-lg bg-accent px-4 py-2 text-xs font-bold text-slate-950 transition-colors hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSaving ? "Applying correction changes..." : "Commit Administrative Taxonomy Change"}
        </button>
      </form>
    </article>
  );
}

export default function AdminPostCorrections({
  initialPosts,
  initialHistory,
}: {
  initialPosts: any[];
  initialHistory: CorrectionHistoryEntry[];
}) {
  const router = useRouter();
  const [posts, setPosts] = useState<AdminPost[]>(() => 
    initialPosts.map((post) => ({
      ...post,
      author: Array.isArray(post.author) ? post.author[0] : post.author,
    }))
  );
  const [history, setHistory] = useState<CorrectionHistoryEntry[]>(initialHistory);
  const [search, setSearch] = useState("");

  const filteredPosts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return posts;
    return posts.filter((post) => {
      const author = Array.isArray(post.author) ? post.author[0] : post.author;
      return (
        post.title.toLocaleLowerCase().includes(query) ||
        author?.username?.toLocaleLowerCase().includes(query) ||
        author?.display_name?.toLocaleLowerCase().includes(query)
      );
    });
  }, [posts, search]);

  function handleCorrected(correction: CorrectionResult) {
    setPosts((current) =>
      current.map((post) =>
        post.id === correction.id
          ? { ...post, media_type: correction.media_type, tmdb_id: correction.tmdb_id }
          : post
      )
    );
    setHistory((current) => [
      {
        id: `${correction.id}-${correction.corrected_at}`,
        post_id: correction.id,
        post_title: correction.title,
        actor_id: null,
        previous_media_type: correction.previous_media_type,
        new_media_type: correction.media_type,
        previous_tmdb_id: correction.previous_tmdb_id,
        new_tmdb_id: correction.tmdb_id,
        reason: correction.reason ?? "",
        created_at: correction.corrected_at,
        actor_name: "You (Admin)",
      },
      ...current,
    ].slice(0, 20));
    router.refresh();
  }

  return (
    <section className="mx-auto mt-8 max-w-4xl rounded-3xl border border-text-muted/15 bg-surface p-6 sm:p-8 space-y-6">
      <div className="flex items-start gap-3 border-b border-text-muted/10 pb-4">
        <Shield className="text-accent h-6 w-6 mt-0.5 shrink-0" />
        <div>
          <h2 className="text-xl font-black tracking-tight text-foreground">Taxonomy & Audit Management</h2>
          <p className="text-xs text-text-muted mt-1">
            Enforce correct data classifications across all active articles. Each modification appends an administrative trace trail and alerts the author.
          </p>
        </div>
      </div>

      <label className="block text-xs font-bold text-text-muted uppercase tracking-wider">
        Find publication index
        <div className="relative mt-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Filter by article headline, writer display handle, or account username..."
            className="w-full rounded-xl border border-text-muted/20 bg-background pl-10 pr-4 py-3 text-sm text-foreground outline-none focus:border-accent"
          />
        </div>
      </label>

      {filteredPosts.length ? (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <PostCorrectionCard key={post.id} post={post} onCorrected={handleCorrected} />
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-text-muted/20 p-8 text-center text-sm text-text-muted">
          {posts.length ? "No active publications match your filter parameters." : "There are no database entries indexed yet."}
        </p>
      )}

      <div className="pt-6 border-t border-text-muted/15">
        <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5 mb-4">
          <History className="h-4 w-4" /> Global Classification Audit Logs
        </h3>
        {history.length ? (
          <ol className="space-y-3">
            {history.map((entry) => (
              <li key={entry.id} className="rounded-xl border border-text-muted/10 bg-background/40 p-3.5 text-xs shadow-sm">
                <p className="font-bold text-foreground">{entry.post_title}</p>
                <p className="mt-1 font-medium text-text-muted">
                  {formatTopicType(entry.previous_media_type)}
                  {entry.previous_tmdb_id ? ` [Index #${entry.previous_tmdb_id}]` : ""}
                  {" ➔ "}
                  <span className="text-accent">{formatTopicType(entry.new_media_type)}</span>
                  {entry.new_tmdb_id ? ` [Index #${entry.new_tmdb_id}]` : ""}
                </p>
                {entry.reason && <p className="mt-2 text-foreground/90 italic bg-surface/30 p-2 rounded border border-text-muted/5">Reason: "{entry.reason}"</p>}
                <p className="mt-2 text-[10px] text-text-muted">
                  Modified by: {entry.actor_name} · Trace timestamp: {formatAuditDate(entry.created_at)}
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-xs text-text-muted">No historical reclassifications recorded inside the logging registry.</p>
        )}
      </div>
    </section>
  );
}

