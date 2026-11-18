// ==========================================================================
// 🚀 STEP 1: src/utils/blogService.ts (Enforcing Server-Side Topic Filters)
// ==========================================================================
import { createClient } from "@/utils/supabase/server";

export type BlogPost = {
  id: string;
  comment_count?: number;
  like_count?: number;
  liked_by_me?: boolean;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  is_pinned: boolean;
  pinned_at: string | null;
  body: string;
  status: "draft" | "published";
  content_type: "review" | "article";
  category: string;
  published_at: string | null;
  created_at: string;
  author: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

export type BlogComment = {
  id: string;
  post_id: string;
  author_id: string;
  parent_id: string | null;
  body: string;
  created_at: string;
  updated_at: string;
  author: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  mention_usernames?: string[];
  like_count: number;
  liked_by_me: boolean;
};

type PostCommentCount = { count: number | string | null };
type PostWithCommentCounts = Omit<BlogPost, "comment_count" | "like_count" | "liked_by_me" | "author"> & {
  author: BlogPost["author"] | NonNullable<BlogPost["author"]>[];
  comments: PostCommentCount[] | PostCommentCount | null;
};
type CommentRow = Pick<BlogComment, "id" | "post_id" | "author_id" | "parent_id" | "body" | "created_at" | "updated_at">;
type CommentLikeSummaryRow = {
  comment_id: string;
  like_count: number | string;
  liked_by_me: boolean;
};
type CommentProfileRow = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

export type CommentReport = {
  id: string;
  comment_id: string | null;
  post_id: string;
  reporter_id: string;
  reason: "spam" | "harassment" | "inappropriate" | "other";
  details: string;
  reported_comment_body: string;
  created_at: string;
  post: { title: string; slug: string } | null;
  reporter: { username: string | null; display_name: string | null } | null;
};

export type PublicProfile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  cover_image_url: string | null;
  bio: string | null;
};

export const postFields = `
  id,
  title,
  slug,
  excerpt,
  cover_image_url,
  is_pinned,
  pinned_at,
  body,
  status,
  content_type,
  category,
  published_at,
  created_at,
  author:profiles!posts_author_id_fkey(username, display_name, avatar_url)
`;

export async function getPublishedPostsPage(page: number, pageSize: number, topic?: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError && authError.name !== "AuthSessionMissingError") {
    throw new Error(authError.message);
  }
  
  let countQuery = supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");

  if (topic && topic !== "all") {
    countQuery = countQuery.eq("category", topic);
  }

  const { count, error: countError } = await countQuery;
  if (countError) throw new Error(countError.message);

  const total = count ?? 0;
  const totalPages = Math.ceil(total / pageSize);
  const currentPage = totalPages > 0 ? Math.min(page, totalPages) : 1;
  const start = (currentPage - 1) * pageSize;
  
  let fetchQuery = supabase
    .from("posts")
    .select(`${postFields}, comments(count)`)
    .eq("status", "published")
    .eq("comments.is_removed", false);

  if (topic && topic !== "all") {
    fetchQuery = fetchQuery.eq("category", topic);
  }

  const { data, error } = await fetchQuery
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false })
    .range(start, start + pageSize - 1);

  if (error) throw new Error(error.message);

  const postIds = (data ?? []).map((post) => post.id);
  const { data: likeSummaries, error: likesError } = await supabase.rpc("get_post_like_summary", {
    p_post_ids: postIds,
  });
  if (likesError) throw new Error(likesError.message);
  
  const likeRows = (likeSummaries ?? []) as Array<{
    post_id: string;
    like_count: number | string;
    liked_by_me: boolean;
  }>;
  const likesByPostId = new Map(likeRows.map((like) => [like.post_id, like] as const));

  const postRows = (data ?? []) as PostWithCommentCounts[];
  const formattedPosts: BlogPost[] = postRows.map((post) => {
    const commentCount = getCommentCount(post.comments);
    const author = Array.isArray(post.author) ? post.author[0] ?? null : post.author;

    const likeData = likesByPostId.get(post.id);

    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      cover_image_url: post.cover_image_url,
      body: post.body,
      status: post.status,
      content_type: post.content_type,
      category: post.category ?? "general",
      is_pinned: Boolean(post.is_pinned),
      pinned_at: post.pinned_at,
      published_at: post.published_at,
      created_at: post.created_at,
      comment_count: commentCount,
      like_count: likeData ? Number(likeData.like_count) : 0,
      liked_by_me: likeData ? Boolean(likeData.liked_by_me) : false,
      author: author ? {
        username: author.username ?? null,
        display_name: author.display_name ?? null,
        avatar_url: author.avatar_url ?? null,
      } : null,
    };
  });

  return {
    posts: formattedPosts,
    currentPage,
    totalPages,
    total,
    currentUserId: user?.id ?? null,
  };
}

function getCommentCount(comments: PostWithCommentCounts["comments"]) {
  const count = Array.isArray(comments) ? comments[0]?.count : comments?.count;
  return Number(count ?? 0);
}

export async function getPostLikeSummary(postId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_post_like_summary", {
    p_post_ids: [postId],
  });
  if (error) throw new Error(error.message);
  const like = (data ?? [])[0] as { like_count: number | string; liked_by_me: boolean } | undefined;
  return { likeCount: Number(like?.like_count ?? 0), likedByMe: Boolean(like?.liked_by_me) };
}

export async function getPublishedPostsByAuthor(authorId: string): Promise<BlogPost[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(`${postFields}, comments(count)`)
    .eq("author_id", authorId)
    .eq("status", "published")
    .eq("comments.is_removed", false)
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false });
  if (error) throw new Error(error.message);
  const posts = (data ?? []) as PostWithCommentCounts[];
  return posts.map(({ author, comments, ...post }): BlogPost => ({
    ...post,
    author: Array.isArray(author) ? author[0] ?? null : author,
    comment_count: getCommentCount(comments),
  }));
}

export async function getPublicProfile(username: string): Promise<PublicProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, cover_image_url, bio")
    .eq("username", username.toLowerCase())
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as PublicProfile | null;
}

export async function getPublishedPost(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("posts").select(postFields).eq("slug", slug).eq("status", "published").maybeSingle();
  if (error) throw new Error(error.message);
  return data as unknown as BlogPost | null;
}

export async function getPublishedPostComments(postId: string, currentUserId: string | null): Promise<BlogComment[]> {
  const supabase = await createClient();
  const { data: comments, error } = await supabase.from("comments").select("id, post_id, author_id, parent_id, body, created_at, updated_at").eq("post_id", postId).eq("is_removed", false).order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  const commentRows = (comments ?? []) as CommentRow[];
  if (!commentRows.length) return [];
  const { data: likes, error: likesError } = await supabase.rpc("get_comment_like_summary", { p_comment_ids: commentRows.map((comment) => comment.id) });
  if (likesError) throw new Error(likesError.message);
  const likeRows = (likes ?? []) as CommentLikeSummaryRow[];
  const likesByCommentId = new Map(likeRows.map((like) => [like.comment_id, like] as const));
  const authorIds = [...new Set(commentRows.map((comment) => comment.author_id))];
  const usernames = [...new Set(commentRows.flatMap((comment) => [...comment.body.matchAll(/(^|[^a-zA-Z0-9_-])@([a-z0-9_-]{3,30})(?=\$|[^a-z0-9_-])/gi)].map((match) => match[2].toLowerCase())))];
  const { data: profiles, error: pErr } = await supabase.from("profiles").select("id, username, display_name, avatar_url").in("id", authorIds);
  if (pErr) throw new Error(pErr.message);
  const mQuery = usernames.length ? await supabase.from("profiles").select("username").in("username", usernames) : { data: [], error: null };
  if (mQuery.error) throw new Error(mQuery.error.message);
  const matchedProfiles = (mQuery.data ?? []) as Array<{ username: string | null }>;
  const knownUsernames = new Set(matchedProfiles.map((profile) => profile.username?.toLowerCase()));
  const profileRows = (profiles ?? []) as CommentProfileRow[];
  const profilesById = new Map(profileRows.map((profile) => [profile.id, profile] as const));
  return commentRows.map((comment): BlogComment => ({
    ...comment,
    author: profilesById.get(comment.author_id) ?? null,
    like_count: Number(likesByCommentId.get(comment.id)?.like_count ?? 0),
    liked_by_me: currentUserId ? Boolean(likesByCommentId.get(comment.id)?.liked_by_me) : false,
    mention_usernames: [...new Set([...comment.body.matchAll(/(^|[^a-zA-Z0-9_-])@([a-z0-9_-]{3,30})(?=\$|[^a-z0-9_-])/gi)].map((match) => match[2].toLowerCase()).filter((username) => knownUsernames.has(username)))]
  }));
}

export async function getOpenCommentReports(): Promise<CommentReport[]> {
  const supabase = await createClient();
  const { data: reports, error } = await supabase
    .from("comment_reports")
    .select(`
      id, 
      comment_id, 
      post_id, 
      reporter_id, 
      reason, 
      details, 
      reported_comment_body, 
      created_at, 
      post:posts!comment_reports_post_id_fkey(title, slug)
    `)
    .is("resolved_at", null)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  if (!reports?.length) return [];

  const rIds = [...new Set(reports.map((r) => r.reporter_id))];
  const { data: profiles, error: pErr } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .in("id", rIds);

  if (pErr) throw new Error(pErr.message);

  const profilesById = new Map((profiles ?? []).map((p) => [p.id, p]));
  return reports.map((r) => ({
    ...r,
    reporter: profilesById.get(r.reporter_id) ?? null,
  })) as unknown as CommentReport[];
}

