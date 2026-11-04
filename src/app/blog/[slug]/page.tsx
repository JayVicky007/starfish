import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, Calendar, User, Heart, MessageSquare } from "lucide-react";
import { getPostLikeSummary, getPublishedPost, getPublishedPostComments } from "@/utils/blogService";
import { sanitizePostHtml } from "@/utils/sanitizePostHtml";
import { createClient } from "@/utils/supabase/server";
import BlogComments from "@/components/BlogComments";
import PostLikeButton from "@/components/PostLikeButton";

function formatDate(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date(value));
}

const topicLabels: Record<string, string> = {
  saas: "SaaS & Architecture",
  ai: "AI & Automation",
  devops: "DevOps & Infosec",
  design: "Design Systems",
  general: "General / Other",
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  let post = null;

  try {
    post = await getPublishedPost(slug);
  } catch {
    post = null;
  }

  if (!post) notFound();

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError && authError.name !== "AuthSessionMissingError") {
    throw new Error(authError.message);
  }
  
  const [comments, likeSummary] = await Promise.all([
    getPublishedPostComments(post.id, user?.id ?? null),
    getPostLikeSummary(post.id),
  ]);

  let profile: any = null;
  if (user) {
    const { data, error } = await supabase
      .from("profiles")
      .select("username, display_name, avatar_url, role")
      .eq("id", user.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    profile = data;
  }

  const authorName = post.author?.display_name || post.author?.username || "Platform Developer";
  const currentTopic = topicLabels[post.category] || "General Technical";
  const currentAuthor = {
    username: profile?.username ?? null,
    display_name: profile?.display_name ?? user?.user_metadata?.display_name ?? null,
    avatar_url: profile?.avatar_url ?? null,
  };
  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground sm:py-16">
      <article className="mx-auto max-w-3xl">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-text-muted transition-colors hover:text-accent">
          ← Back to Engineering Hub
        </Link>
        
        <div className="mt-10 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
          <span className="flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/5 px-2.5 py-1">
            <BookOpen className="h-3 w-3" />
            {currentTopic}
          </span>
          <span aria-hidden="true" className="text-text-muted/40">·</span>
          <span className="text-text-muted">{post.content_type}</span>
        </div>
        
        <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-5xl md:text-6xl text-foreground">
          {post.title}
        </h1>
        
        <div className="mt-6 flex items-center gap-4 border-y border-text-muted/10 py-4 text-sm text-text-muted">
          {post.author?.username ? (
            <Link href={`/users/${post.author.username}`} className="flex items-center gap-3 hover:text-accent transition-colors group">
              {post.author.avatar_url ? (
                <img src={post.author.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover border border-text-muted/10" />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface border border-text-muted/10 font-bold text-foreground text-xs">
                  {authorName[0].toUpperCase()}
                </span>
              )}
              <div>
                <span className="block font-bold text-foreground group-hover:text-accent transition-colors">{authorName}</span>
                <span className="block text-xs">@{post.author.username}</span>
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              {post.author?.avatar_url ? (
                <img src={post.author.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface font-bold text-xs">
                  {authorName[0].toUpperCase()}
                </span>
              )}
              <span>{authorName}</span>
            </div>
          )}
          
          <div className="ml-auto flex items-center gap-1.5 text-xs font-medium">
            <Calendar className="h-3.5 w-3.5 text-text-muted/60" />
            <span>{formatDate(post.published_at)}</span>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <PostLikeButton
            postId={post.id}
            initialCount={likeSummary.likeCount}
            initialLiked={likeSummary.likedByMe}
            currentUserId={user?.id ?? null}
          />
        </div>

        <div 
          className="prose prose-invert max-w-none text-foreground/90 mt-10 leading-relaxed break-words"
          dangerouslySetInnerHTML={{ __html: sanitizePostHtml(post.body) }}
        />
      </article>

      <div className="mx-auto max-w-3xl mt-12">
        <BlogComments
          key={comments.map((comment) => `${comment.id}:${comment.updated_at}`).join(",")}
          postId={post.id}
          initialComments={comments}
          currentUserId={user?.id ?? null}
          currentAuthor={currentAuthor}
          isAdmin={profile?.role === "admin"}
        />
      </div>
    </main>
  );
}
