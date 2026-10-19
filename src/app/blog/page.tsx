// ==========================================================================
// (Interactive Sector Matrix Grid)
// ==========================================================================
import Link from "next/link";
import { ChevronLeft, ChevronRight, BookOpen, MessageSquare, Terminal } from "lucide-react";
import PostLikeButton from "@/components/PostLikeButton";
import { getPublishedPostsPage, type BlogPost } from "@/utils/blogService";

const POSTS_PER_PAGE = 9;

export const topicLabels: Record<string, string> = {
  all: "All Systems",
  saas: "SaaS & Architecture",
  ai: "AI & Automation",
  devops: "DevOps & Infosec",
  design: "Design Systems",
};

function formatDate(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(value));
}

interface BlogPageProps {
  searchParams: Promise<{ page?: string; topic?: string }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const resolvedParams = await searchParams;
  const activeTopic = resolvedParams.topic || "all";
  const requestedPage = Number.parseInt(resolvedParams.page ?? "1", 10);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  let posts: BlogPost[] = [];
  let errorMessage = "";
  let currentPage = 1;
  let totalPages = 0;
  let totalPosts = 0;
  let currentUserId: string | null = null;

  try {
    const result = await getPublishedPostsPage(page, POSTS_PER_PAGE, activeTopic);
    posts = result.posts;
    currentPage = result.currentPage;
    totalPages = result.totalPages;
    totalPosts = result.total;
    currentUserId = result.currentUserId;
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Unable to load engineering publications.";
  }

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground sm:py-16">
      <header className="mx-auto max-w-7xl border-b border-text-muted/10 pb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/5 px-3 py-1 text-xs font-semibold text-trending-text dark:text-accent">
          <BookOpen className="h-3.5 w-3.5" />
          <span>Starfish Knowledge Base</span>
        </div>
        <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Engineering & Strategy</h1>
        <p className="mt-3 max-w-2xl text-base text-text-muted">
          Deep dives into software architecture, automated workflows, secure infrastructures, and design mechanics.
        </p>

        {/* Premium Corporate Selection Badges Grid Layer */}
        <nav aria-label="Topic Navigation System" className="mt-8 flex flex-wrap gap-2">
          {Object.entries(topicLabels).map(([key, label]) => {
            const isActive = activeTopic === key;
            const queryUrl = key === "all" ? "/blog" : `/blog?topic=${key}`;
            return (
              <Link
                key={key}
                href={queryUrl}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all border ${
                  isActive
                    ? "bg-accent border-accent text-slate-950 shadow-md shadow-accent/10"
                    : "border-text-muted/15 bg-surface text-text-muted hover:border-accent/40 hover:text-accent"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </header>

      <section className="mx-auto mt-12 max-w-7xl">
        {errorMessage ? (
          <p role="alert" className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-5 text-rose-500 font-semibold">{errorMessage}</p>
        ) : posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-text-muted/20 p-12 text-center text-sm text-text-muted font-medium">
            No published engineering modules available inside this scope directory yet.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => {
              const authorName = post.author?.display_name || post.author?.username || "Platform Developer";
              const currentTopic = topicLabels[post.media_type] || "General Technical";
              
              return (
                <article key={post.id} className="group relative flex flex-col justify-between rounded-2xl border border-text-muted/15 bg-surface p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-accent/60 hover:shadow-md">
                  <div>
                    {post.cover_image_url && (
                      <img src={post.cover_image_url} alt="" className="-mx-6 -mt-6 mb-5 aspect-video w-[calc(100%+3rem)] rounded-t-2xl object-cover" />
                    )}
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-accent">
                      <span className="flex items-center gap-1.5 font-bold">
                        <Terminal size={12} />
                        {currentTopic}
                      </span>
                      {post.is_pinned && <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px]">Pinned Baseline</span>}
                    </div>
                    
                    <h2 className="mt-4 text-xl font-black tracking-tight text-foreground transition-colors group-hover:text-accent">
                      <Link href={`/blog/${post.slug}`} className="focus:outline-none">
                        <span className="absolute inset-0" aria-hidden="true" />
                        {post.title}
                      </Link>
                    </h2>
                    
                    {post.excerpt && <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-text-muted">{post.excerpt}</p>}
                  </div>
                  
                  <div className="mt-6 flex items-center justify-between border-t border-text-muted/10 pt-4 text-xs text-text-muted relative z-20">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-background font-bold text-foreground border border-text-muted/10 text-[10px]">
                        {authorName.charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <span className="block font-bold text-foreground">{authorName}</span>
                        <span className="block text-[10px] font-normal">{formatDate(post.published_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Link href={`/blog/${post.slug}#comments-heading`} className="flex items-center gap-1 hover:text-accent font-semibold transition-colors">
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>{post.comment_count ?? 0}</span>
                      </Link>
                      <PostLikeButton postId={post.id} initialCount={post.like_count ?? 0} initialLiked={post.liked_by_me ?? false} currentUserId={currentUserId} compact />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!errorMessage && totalPages > 1 && (
          <nav aria-label="Pagination Control System" className="mt-12 flex items-center justify-between border-t border-text-muted/10 pt-6">
            <p className="text-xs font-semibold text-text-muted">Index View {currentPage} of {totalPages}</p>
            <div className="flex items-center gap-1.5">
              <Link href={currentPage === 2 ? `/blog${activeTopic !== "all" ? `?topic=\${activeTopic}` : ""}` : `/blog?page=${currentPage - 1}${activeTopic !== "all" ? `&topic=\${activeTopic}` : ""}`} className={`inline-flex h-9 items-center gap-1 rounded-xl border border-text-muted/15 px-3 text-xs font-semibold transition-colors ${currentPage === 1 ? "pointer-events-none opacity-40" : "hover:bg-accent/10 hover:text-accent"}`}>
                <ChevronLeft className="h-3.5 w-3.5" /> Previous Matrix
              </Link>
              <Link href={`/blog?page=${currentPage + 1}${activeTopic !== "all" ? `&topic=\${activeTopic}` : ""}`} className={`inline-flex h-9 items-center gap-1 rounded-xl border border-text-muted/15 px-3 text-xs font-semibold transition-colors ${currentPage === totalPages ? "pointer-events-none opacity-40" : "hover:bg-accent/10 hover:text-accent"}`}>
                Next Cluster <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </nav>
        )}
      </section>
    </main>
  );
}




// import Link from "next/link";
// import { ChevronLeft, ChevronRight } from "lucide-react";
// import PostLikeButton from "@/components/PostLikeButton";
// import { formatBlogMediaType, getPublishedPostsPage, type BlogPost } from "@/utils/blogService";

// const POSTS_PER_PAGE = 9;

// function getPageLinks(currentPage: number, totalPages: number): Array<number | "ellipsis"> {
//   const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
//   const visiblePages = [...pages]
//     .filter((page) => page >= 1 && page <= totalPages)
//     .sort((first, second) => first - second);

//   return visiblePages.flatMap((page, index) => {
//     const previousPage = visiblePages[index - 1];
//     return [
//       ...(previousPage && page - previousPage > 1 ? ["ellipsis" as const] : []),
//       page,
//     ];
//   });
// }

// function formatDate(value: string | null) {
//   if (!value) return "";
//   return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
// }

// export default async function BlogPage({
//   searchParams,
// }: {
//   searchParams: Promise<{ page?: string }>;
// }) {
//   const { page: pageParam } = await searchParams;
//   const requestedPage = Number.parseInt(pageParam ?? "1", 10);
//   const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
//   let posts: BlogPost[] = [];
//   let errorMessage = "";
//   let currentPage = 1;
//   let totalPages = 0;
//   let totalPosts = 0;
//   let currentUserId: string | null = null;

//   try {
//     const result = await getPublishedPostsPage(page, POSTS_PER_PAGE);
//     posts = result.posts;
//     currentPage = result.currentPage;
//     totalPages = result.totalPages;
//     totalPosts = result.total;
//     currentUserId = result.currentUserId;
//   } catch (error) {
//     errorMessage = error instanceof Error ? error.message : "Unable to load posts.";
//   }

//   return (
//     <main className="min-h-screen bg-background px-6 py-12 text-foreground sm:py-16">
//       <header className="mx-auto max-w-7xl">
//         <p className="text-xs font-semibold uppercase tracking-[0.2em] text-trending-text">FilmShift Journal</p>
//         <h1 className="mt-3 text-5xl font-black tracking-tight">The Journal</h1>
//         <p className="mt-4 max-w-2xl text-lg text-text-muted">
//           Film and TV reviews, recommendations, and thoughtful detours through the stories we love.
//           {totalPosts > 0 && <span className="mt-2 block text-sm">{totalPosts} published {totalPosts === 1 ? "post" : "posts"}</span>}
//         </p>
//       </header>

//       <section className="mx-auto mt-12 max-w-7xl">
//         {errorMessage ? (
//           <p role="alert" className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-5 text-rose-700 dark:text-rose-200">{errorMessage}</p>
//         ) : posts.length === 0 ? (
//           <div className="rounded-2xl border border-text-muted/15 bg-surface p-8 text-text-muted">No published posts yet. Be the first to write one.</div>
//         ) : (
//           <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
//             {posts.map((post) => {
//               const authorName = post.author?.display_name || post.author?.username || "FilmShift member";
//               return (
//                 <article 
//                   key={post.id} 
//                   className="group relative rounded-2xl border border-text-muted/15 bg-surface p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-accent/60 hover:shadow-[0_10px_35px_rgba(234,179,8,0.08)] cursor-pointer"
//                 >
//                   {post.cover_image_url && (
//                     <img
//                       src={post.cover_image_url}
//                       alt=""
//                       className="-mx-6 -mt-6 mb-5 aspect-video w-[calc(100%+3rem)] rounded-t-2xl object-cover"
//                     />
//                   )}
//                   <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
//                     <span className="flex items-center gap-2">
//                       {post.content_type}
//                       {post.is_pinned && (
//                         <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] text-accent">
//                           Pinned
//                         </span>
//                       )}
//                     </span>
//                     <span>{formatBlogMediaType(post.media_type)}</span>
//                   </div>
                  
//                   <h2 className="mt-5 text-2xl font-black tracking-tight">
//                     <Link href={`/blog/${post.slug}`} className="transition-colors group-hover:text-accent focus:outline-none">
//                       <span className="absolute inset-0" aria-hidden="true" />
//                       {post.title}
//                     </Link>
//                   </h2>
                  
//                   {post.excerpt && <p className="mt-3 line-clamp-3 text-text-muted">{post.excerpt}</p>}
                  
//                   <div className="mt-6 flex items-center gap-3 border-t border-text-muted/10 pt-4 text-sm text-text-muted">
//                     {post.author?.avatar_url ? (
//                       <img src={post.author.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
//                     ) : (
//                       <span className="flex h-8 w-8 items-center justify-center rounded-full bg-background font-bold">
//                         {authorName[0]}
//                       </span>
//                     )}
//                     {post.author?.username ? (
//                       <Link
//                         href={`/users/${post.author.username}`}
//                         className="relative z-20 min-w-0 hover:text-accent"
//                         aria-label={`View ${authorName}'s profile`}
//                       >
//                         <span className="block truncate">{authorName}</span>
//                         <span className="block text-xs font-normal normal-case tracking-normal">@{post.author.username}</span>
//                       </Link>
//                     ) : (
//                       <span>{authorName}</span>
//                     )}
//                     <span aria-hidden="true">·</span>
//                     <span>{formatDate(post.published_at)}</span>
//                     <Link
//                       href={`/blog/${post.slug}#comments-heading`}
//                       className="relative z-20 whitespace-nowrap hover:text-accent"
//                       aria-label={`${post.comment_count ?? 0} comments on ${post.title}`}
//                     >
//                       {post.comment_count ?? 0} {post.comment_count === 1 ? "comment" : "comments"}
//                     </Link>
//                     <PostLikeButton
//                       postId={post.id}
//                       initialCount={post.like_count ?? 0}
//                       initialLiked={post.liked_by_me ?? false}
//                       currentUserId={currentUserId}
//                       compact
//                     />
//                   </div>
//                 </article>
//               );
//             })}
//           </div>
//         )}
//         {!errorMessage && totalPages > 1 && (
//           <nav aria-label="Journal pages" className="mt-12 flex flex-col items-center justify-between gap-4 rounded-2xl border border-text-muted/15 bg-surface/70 px-4 py-4 sm:flex-row sm:px-5">
//             <p className="text-sm text-text-muted">
//               Page <span className="font-semibold text-foreground">{currentPage}</span> of{" "}
//               <span className="font-semibold text-foreground">{totalPages}</span>
//             </p>
//             <div className="flex items-center gap-1.5">
//               <Link
//                 href={currentPage === 2 ? "/blog" : `/blog?page=${currentPage - 1}`}
//                 aria-label="Previous page"
//                 aria-disabled={currentPage === 1}
//                 tabIndex={currentPage === 1 ? -1 : undefined}
//                 className={`flex h-10 items-center gap-1 rounded-xl border border-text-muted/15 px-3 text-sm font-semibold transition-colors ${
//                   currentPage === 1
//                     ? "pointer-events-none opacity-40"
//                     : "hover:border-accent/50 hover:bg-accent/10"
//                 }`}
//               >
//                 <ChevronLeft className="h-4 w-4" />
//                 <span className="hidden sm:inline">Previous</span>
//               </Link>
//               {getPageLinks(currentPage, totalPages).map((pageLink, index) => pageLink === "ellipsis" ? (
//                 <span key={`ellipsis-${index}`} aria-hidden="true" className="px-1 text-text-muted">…</span>
//               ) : (
//                 <Link
//                   key={pageLink}
//                   href={pageLink === 1 ? "/blog" : `/blog?page=${pageLink}`}
//                   aria-label={`Page ${pageLink}`}
//                   aria-current={pageLink === currentPage ? "page" : undefined}
//                   className={`flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition-colors ${
//                     pageLink === currentPage
//                       ? "border-accent bg-accent text-slate-950 shadow-sm"
//                       : "border-text-muted/15 hover:border-accent/50 hover:bg-accent/10"
//                   }`}
//                 >
//                   {pageLink}
//                 </Link>
//               ))}
//               <Link
//                 href={`/blog?page=${currentPage + 1}`}
//                 aria-label="Next page"
//                 aria-disabled={currentPage === totalPages}
//                 tabIndex={currentPage === totalPages ? -1 : undefined}
//                 className={`flex h-10 items-center gap-1 rounded-xl border border-text-muted/15 px-3 text-sm font-semibold transition-colors ${
//                   currentPage === totalPages
//                     ? "pointer-events-none opacity-40"
//                     : "hover:border-accent/50 hover:bg-accent/10"
//                 }`}
//               >
//                 <span className="hidden sm:inline">Next</span>
//                 <ChevronRight className="h-4 w-4" />
//               </Link>
//             </div>
//           </nav>
//         )}
//       </section>
//     </main>
//   );
// }
