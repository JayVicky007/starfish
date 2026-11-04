import Link from "next/link";
import { HelpCircle, Terminal } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto w-full border-t border-text-muted/15 bg-surface/70 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8 sm:py-14 lg:px-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr]">
          <div className="max-w-sm space-y-4">
            <Link
              href="/"
              className="text-2xl font-black tracking-tight text-foreground transition-colors hover:text-accent"
            >
              <span>Star</span>
              <span className="text-accent">fish</span>
            </Link>
            <p className="text-sm font-medium leading-6 text-text-muted">
              A sample editorial application built with Next.js, Supabase, and
              Tiptap. Replace the sample branding and configure your own
              services before deployment.
            </p>
          </div>

          <nav aria-label="Application">
            <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-accent">
              <Terminal size={12} /> Explore
            </h2>
            <ul className="mt-4 space-y-3 text-sm font-medium text-text-muted">
              <li>
                <Link href="/blog" className="transition-colors hover:text-accent">
                  Articles
                </Link>
              </li>
              <li>
                <Link href="/profile" className="transition-colors hover:text-accent">
                  Profile
                </Link>
              </li>
              <li>
                <Link href="/login" className="transition-colors hover:text-accent">
                  Sign in
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Documentation">
            <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-accent">
              <HelpCircle size={12} /> Resources
            </h2>
            <ul className="mt-4 space-y-3 text-sm font-medium text-text-muted">
              <li>
                <a
                  href="https://nextjs.org/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-accent"
                >
                  Next.js documentation
                </a>
              </li>
              <li>
                <a
                  href="https://supabase.com/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-accent"
                >
                  Supabase documentation
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-10 border-t border-text-muted/10 pt-5 text-xs font-medium leading-5 text-text-muted">
          <p>
            &copy; {currentYear} Starfish sample application. Update this footer
            for your product before deployment.
          </p>
        </div>
      </div>
    </footer>
  );
}
