"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Tag, History, Search, Info } from "lucide-react";

export type AdminPost = {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  category: string | null;
  author_id: string;
  author: { username: string | null; display_name: string | null } | null;
};

export type CorrectionHistoryEntry = {
  id: string;
  post_id: string;
  post_title: string;
  actor_id: string | null;
  previous_category: string | null;
  new_category: string;
  reason: string;
  created_at: string;
  actor_name: string;
};

type CorrectionResult = {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  category: string;
  author_id: string;
  previous_category: string | null;
  reason: string;
  corrected_at: string;
};

const categoryLabels: Record<string, string> = {
  saas: "SaaS & Architecture",
  ai: "AI & Automation",
  devops: "DevOps & Infosec",
  design: "Design Systems",
  general: "General / Other",
};

function formatCategory(value: string | null) {
  if (!value) return "Uncategorized";
  return categoryLabels[value] || value;
}

function formatAuditDate(value: string) {
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
    typeof result.category === "string" &&
    typeof result.author_id === "string" &&
    (result.previous_category === null || typeof result.previous_category === "string") &&
    typeof result.reason === "string" &&
    typeof result.corrected_at === "string";
}

function PostCategoryCard({
  post,
  onCorrected,
}: {
  post: AdminPost;
  onCorrected: (correction: CorrectionResult) => void;
}) {
  const supabase = createClient();
  const [category, setCategory] = useState(post.category ?? "");
  const [reason, setReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const isDirty = category !== (post.category ?? "");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isDirty || isSaving || !category) return;
    if (reason.trim().length < 10 || reason.trim().length > 500) {
      setErrorMessage("Explain the category change in 10 to 500 characters.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    setMessage("");

    try {
      const { data, error } = await supabase.rpc("admin_correct_post_category", {
        p_post_id: post.id,
        p_category: category,
        p_reason: reason.trim(),
      });

      if (error) {
        setErrorMessage(`Unable to correct this post category: ${error.message}`);
      } else {
        const result = Array.isArray(data) ? data[0] : data;
        if (!isCorrectionResult(result)) {
          setErrorMessage("The category correction returned an unexpected response.");
        } else {
          onCorrected(result);
          setReason("");
          setMessage("Post category updated; the author has been notified when applicable.");
        }
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to complete the category change.");
    } finally {
      setIsSaving(false);
    }
  }

  const authorName = post.author?.display_name || "Unknown author";

  return (
    <article className="rounded-2xl border border-text-muted/15 bg-background/60 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-bold text-foreground text-base tracking-tight">{post.title}</h3>
          <p className="mt-1 text-xs text-text-muted">
            By {authorName}{post.author?.username ? ` · @${post.author.username}` : ""} · Published
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
        Current category: <span className="font-semibold text-foreground">{formatCategory(post.category)}</span>
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <label className="block text-xs font-bold text-text-muted uppercase tracking-wider">
          Change category
          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setMessage("");
              setErrorMessage("");
            }}
            className="mt-1.5 w-full rounded-xl border border-text-muted/20 bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          >
            <option value="" disabled>Select a category</option>
            {category && !categoryLabels[category] && (
              <option value={category}>{formatCategory(category)}</option>
            )}
            {Object.entries(categoryLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </label>

        <label className="block text-xs font-bold text-text-muted uppercase tracking-wider">
          Reason for change <span className="font-normal normal-case text-text-muted">(shared with the author)</span>
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
            placeholder="Explain why this post should use a different category."
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
          {isSaving ? "Saving..." : "Save category change"}
        </button>
      </form>
    </article>
  );
}

export default function AdminPostCategoryCorrections({
  initialPosts,
  initialHistory,
}: {
  initialPosts: AdminPost[];
  initialHistory: CorrectionHistoryEntry[];
}) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [history, setHistory] = useState(initialHistory);
  const [search, setSearch] = useState("");

  const filteredPosts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return posts;
    return posts.filter((post) =>
      post.title.toLocaleLowerCase().includes(query) ||
      post.author?.username?.toLocaleLowerCase().includes(query) ||
      post.author?.display_name?.toLocaleLowerCase().includes(query)
    );
  }, [posts, search]);

  function handleCorrected(correction: CorrectionResult) {
    setPosts((current) =>
      current.map((post) =>
        post.id === correction.id ? { ...post, category: correction.category } : post
      )
    );
    setHistory((current) => [
      {
        id: `${correction.id}-${correction.corrected_at}`,
        post_id: correction.id,
        post_title: correction.title,
        actor_id: null,
        previous_category: correction.previous_category,
        new_category: correction.category,
        reason: correction.reason,
        created_at: correction.corrected_at,
        actor_name: "You (Admin)",
      },
      ...current,
    ].slice(0, 20));
    router.refresh();
  }

  return (
    <section className="mx-auto mt-8 max-w-4xl rounded-3xl border border-text-muted/15 bg-surface p-6 sm:p-8 space-y-6">
      <div className="flex items-start gap-3 border-b border-text-muted/10 pb-5">
        <div className="rounded-xl bg-accent/10 p-2.5 text-accent">
          <Tag className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-black tracking-tight">Post category corrections</h2>
          <p className="mt-1 text-xs text-text-muted">
            Change a post&apos;s category, record the reason, and notify its author.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-blue-500/15 bg-blue-500/5 p-3 text-xs text-blue-700 dark:text-blue-300">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>Every change is recorded in the audit history. Authors receive the reason in their notifications.</p>
      </div>

      <label className="block text-xs font-bold text-text-muted uppercase tracking-wider">
        Find a post
        <div className="relative mt-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search post title or author..."
            className="w-full rounded-xl border border-text-muted/20 bg-background pl-10 pr-4 py-3 text-sm text-foreground outline-none focus:border-accent"
          />
        </div>
      </label>

      {filteredPosts.length ? (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <PostCategoryCard key={post.id} post={post} onCorrected={handleCorrected} />
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-text-muted/20 p-8 text-center text-sm text-text-muted">
          {posts.length ? "No posts match your search." : "There are no posts yet."}
        </p>
      )}

      <div className="border-t border-text-muted/15 pt-6">
        <h3 className="mb-4 flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider text-text-muted">
          <History className="h-4 w-4" /> Category change history
        </h3>
        {history.length ? (
          <ol className="space-y-3">
            {history.map((entry) => (
              <li key={entry.id} className="rounded-xl border border-text-muted/10 bg-background/40 p-3.5 text-xs shadow-sm">
                <p className="font-bold text-foreground">{entry.post_title}</p>
                <p className="mt-1 font-medium text-text-muted">
                  {formatCategory(entry.previous_category)}
                  {" → "}
                  <span className="text-accent">{formatCategory(entry.new_category)}</span>
                </p>
                <p className="mt-2 rounded border border-text-muted/5 bg-surface/30 p-2 italic text-foreground/90">
                  Reason: &quot;{entry.reason}&quot;
                </p>
                <p className="mt-2 text-[10px] text-text-muted">
                  Changed by: {entry.actor_name} · {formatAuditDate(entry.created_at)}
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-xs text-text-muted">No category changes have been recorded.</p>
        )}
      </div>
    </section>
  );
}
