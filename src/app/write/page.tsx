import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Terminal, FileEdit } from "lucide-react";
import WritePostForm from "@/components/WritePostForm";
import { createClient } from "@/utils/supabase/server";

export default async function WritePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground sm:py-16">
      <section className="mx-auto w-full max-w-3xl rounded-3xl border border-text-muted/15 bg-surface p-6 shadow-[0_20px_60px_rgba(0,0,0,0.12)] sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-text-muted/10 pb-4">
          <Link 
            href="/profile" 
            className="inline-flex items-center gap-2 text-xs font-bold text-text-muted uppercase tracking-wider transition-colors hover:text-accent"
          >
            <ArrowLeft size={14} />
            <span>Back to Workspace</span>
          </Link>
          <div className="flex items-center gap-1.5 text-xs font-bold text-accent uppercase tracking-wider bg-accent/5 px-2.5 py-1 rounded-full border border-accent/20">
            <Terminal size={12} />
            <span>Starfish Author Sandbox</span>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl flex items-center gap-2">
            <FileEdit className="text-accent" /> Compose Technical Publication
          </h1>
          <p className="text-sm text-text-muted">
            Draft a systematic review or structure a deep-dive module. Your formatting choices persist asynchronously via background cycles.
          </p>
        </div>

        <WritePostForm authorId={data.user.id} />
      </section>
    </main>
  );
}



// import Link from "next/link";
// import { redirect } from "next/navigation";
// import WritePostForm from "@/components/WritePostForm";
// import { createClient } from "@/utils/supabase/server";

// export default async function WritePage() {
//   const supabase = await createClient();
//   const { data } = await supabase.auth.getUser();

//   if (!data.user) {
//     redirect("/login");
//   }

//   return (
//     <main className="min-h-screen bg-background px-6 py-12 text-foreground sm:py-16">
//       <section className="mx-auto w-full max-w-3xl rounded-3xl border border-text-muted/15 bg-surface p-6 shadow-[0_20px_60px_rgba(0,0,0,0.12)] sm:p-8">
//         <Link href="/profile" className="text-sm font-semibold text-text-muted transition-colors hover:text-accent">
//           Back to profile
//         </Link>
//         <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-trending-text">
//           FilmShift community
//         </p>
//         <h1 className="mt-3 text-4xl font-black tracking-tight">Write something worth sharing</h1>
//         <p className="mt-3 text-text-muted">Publish a review or save a draft for later.</p>
//         <WritePostForm authorId={data.user.id} />
//       </section>
//     </main>
//   );
// }
