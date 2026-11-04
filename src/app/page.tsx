import Link from "next/link";
import { ArrowRight, BookOpen, FileEdit, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: FileEdit,
    title: "Write and publish",
    description:
      "Create rich-text posts, save drafts automatically, and publish when they are ready.",
  },
  {
    icon: BookOpen,
    title: "Build a community",
    description:
      "Give readers profiles, comments, replies, likes, and notifications in one starter app.",
  },
  {
    icon: ShieldCheck,
    title: "Start with access controls",
    description:
      "Use Supabase authentication and row-level policies as a foundation to review and extend.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground transition-colors duration-200">
      <section className="relative isolate px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="inline-flex items-center rounded-full border border-accent/30 bg-accent/5 px-4 py-1.5 text-xs font-semibold tracking-wide text-accent">
            Starfish · Editorial starter
          </p>
          <h1 className="mt-8 bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-5xl font-black tracking-tight text-transparent sm:text-6xl md:text-7xl">
            A practical starting point for your next publication
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-text-muted">
            Explore a sample editorial app built with Next.js, Supabase, and
            Tiptap. Customize the code and connect your own Supabase project.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="/blog"
              className="group inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-slate-950 shadow-md transition-all hover:scale-[1.02] hover:bg-yellow-300"
            >
              Browse articles
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/login"
              className="text-sm font-semibold leading-6 text-text-muted transition-colors hover:text-foreground"
            >
              Create an account <span aria-hidden="true">→</span>
            </Link>
          </div>
          <p className="mt-6 text-xs text-text-muted">
            Sample application only. Billing and team workspaces are not included.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold uppercase leading-7 tracking-wider text-accent">
            Included in the starter
          </h2>
          <p className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            The core pieces of an editorial application
          </p>
        </div>
        <dl className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-text-muted/15 bg-surface p-6 shadow-sm"
            >
              <dt className="flex items-center gap-3 text-base font-bold">
                <Icon className="h-5 w-5 text-accent" />
                {title}
              </dt>
              <dd className="mt-4 text-sm leading-6 text-text-muted">
                {description}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
