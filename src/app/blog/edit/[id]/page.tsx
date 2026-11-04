import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import WritePostForm from "@/components/WritePostForm";
import DeleteDraftButton from "@/components/DeleteDraftButton";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Protect the route: Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // 2. Fetch only a post owned by the signed-in user.
  const { data: post, error } = await supabase
    .from("posts")
    .select("id, title, excerpt, cover_image_url, body, content_type, category, status, slug")
    .eq("id", id)
    .eq("author_id", user.id)
    .single();

  if (error?.code === "PGRST116") {
    notFound();
  }
  if (error) {
    throw new Error(`Unable to load draft for editing: ${error.message}`);
  }

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground sm:py-16">
      <section className="mx-auto w-full max-w-3xl rounded-3xl border border-text-muted/15 bg-surface p-6 shadow-[0_20px_60px_rgba(0,0,0,0.12)] sm:p-8">
        <div className="flex items-center justify-between">
          <Link href="/profile" className="text-sm font-semibold text-text-muted transition-colors hover:text-accent">
            Cancel & Back to Profile
          </Link>
          
          {/* Only render delete button for unpublished drafts */}
          {post.status === "draft" && <DeleteDraftButton postId={post.id} />}
        </div>

        <h1 className="mt-6 text-4xl font-black tracking-tight">Revise your masterpiece</h1>
        <p className="mt-2 text-text-muted">Modify your formatting content or transition this draft into a live publication.</p>
        
        <WritePostForm 
          authorId={user.id} 
          initialPost={post}
        />
      </section>
    </main>
  );
}
