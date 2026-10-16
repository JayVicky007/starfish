// import HomeHero from "@/components/HomeHero";
// import ContentRail from "@/components/ContentRail";
// import TrailerRail from "@/components/TrailerRail";
// import PopularRail from "@/components/PopularRail";
// import {
//   getLatestTrailers,
//   getUpcomingMoviesByPeriod,
//   getTopRatedMoviesByPeriod,
//   getTopRatedTvByPeriod,
//   getUnifiedTrendingByPeriod,
//   getUpcomingTvShows,
//   getPopularContent,
// } from "@/utils/movieService";

// export default async function HomePage() {
//   const [
//     trendingMixed,
//     topRatedMovies,
//     topRatedTv,
//     upcomingMovies,
//     upcomingTv,
//     latestTrailers,
//     popular,
//   ] = await Promise.all([
//     getUnifiedTrendingByPeriod("day"),
//     getTopRatedMoviesByPeriod("month"),
//     getTopRatedTvByPeriod("month"),
//     getUpcomingMoviesByPeriod("1-month"),
//     getUpcomingTvShows("1-month"),
//     getLatestTrailers(),
//     getPopularContent("streaming"),
//   ]);

//   const topRatedMixed = [];
//   const maxCuratedLength = Math.max(topRatedMovies.length, topRatedTv.length);
//   for (let i = 0; i < maxCuratedLength; i++) {
//     if (topRatedMovies[i]) topRatedMixed.push({ ...topRatedMovies[i], media_type: "movie" });
//     if (topRatedTv[i]) topRatedMixed.push({ ...topRatedTv[i], media_type: "tv" });
//   }

//   const comingSoon = [
//     ...upcomingMovies.map((movie) => ({ ...movie, media_type: "movie" })),
//     ...upcomingTv,
//   ]
//     .sort((first, second) =>
//       (second.popularity ?? 0) - (first.popularity ?? 0) ||
//       first.release_date.localeCompare(second.release_date),
//     )
//     .slice(0, 20);

//   return (
//     <main className="min-h-screen bg-background px-4 pb-4 text-foreground sm:px-8 sm:pb-8">
//       <HomeHero movies={trendingMixed} />

//       <div className="mx-auto mt-16 max-w-7xl space-y-16">
//         <ContentRail
//           title="Trending"
//           movies={trendingMixed}
//           periodFilter
//           periodCategory="trending"
//         />
//         <PopularRail movies={popular} />
//         <TrailerRail trailers={latestTrailers} />
//         <ContentRail
//           title="Top Rated Movies & TV"
//           movies={topRatedMixed}
//           periodFilter
//           periodCategory="top-rated-mixed"
//         />
//         <ContentRail
//           title="Coming Soon"
//           movies={comingSoon}
//           periodFilter
//           periodCategory="coming-soon"
//         />
//       </div>
//     </main>
//   );
// }


import Link from "next/link";
import { ArrowRight, BookOpen, Layers, Zap, Shield, Sparkles, Code } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground transition-colors duration-200">
      {/* Premium Hero Section */}
      <section className="relative isolate px-6 pt-24 pb-20 sm:pt-32 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/5 px-4 py-1.5 text-xs font-semibold tracking-wide text-trending-text dark:text-accent">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Introducing Starfish Next.js SaaS Boilerplate</span>
          </div>
          <h1 className="mt-8 text-5xl font-black tracking-tight sm:text-6xl md:text-7xl bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
            Launch Your Next Premium Editorial Platform
          </h1>
          <p className="mt-6 text-lg leading-8 text-text-muted max-w-2xl mx-auto">
            A production-ready, commercial-grade codebase built with Next.js, Supabase RLS, and a beautifully tailored Tiptap WYSIWYG editor. Stop rebuilding auth and billing. Start scaling content.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="/blog"
              className="group inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-slate-950 shadow-md transition-all hover:bg-yellow-300 hover:scale-[1.02]"
            >
              Explore Live Articles Engine
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/login"
              className="text-sm font-semibold leading-6 text-text-muted hover:text-foreground transition-colors"
            >
              Sign Up For Access <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Commercial Technical Grid Core Architecture */}
      <section className="mx-auto max-w-7xl px-6 lg:px-8 pb-24">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-accent uppercase tracking-wider">Enterprise Tech Stack</h2>
          <p className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            Everything you need to ship a commercial publication
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            <div className="flex flex-col rounded-2xl border border-text-muted/15 bg-surface p-6 shadow-sm">
              <dt className="flex items-center gap-x-3 text-base font-bold leading-7">
                <Layers className="h-5 w-5 text-accent" />
                Advanced Tiptap Architecture
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-text-muted">
                <p className="flex-auto text-sm">
                  Full custom editor layout with custom case transformations, drag-and-drop structural handles, absolute crop control nodes, and asset managers built on strict 5MB platform limit controls.
                </p>
              </dd>
            </div>

            <div className="flex flex-col rounded-2xl border border-text-muted/15 bg-surface p-6 shadow-sm">
              <dt className="flex items-center gap-x-3 text-base font-bold leading-7">
                <Shield className="h-5 w-5 text-accent" />
                Supabase RLS Hardening
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-text-muted">
                <p className="flex-auto text-sm">
                  Bulletproof Row Level Security schema configurations protect user mutations, comments pipelines, profile image assets, administrative audit trails, and multi-user team tenant definitions natively.
                </p>
              </dd>
            </div>

            <div className="flex flex-col rounded-2xl border border-text-muted/15 bg-surface p-6 shadow-sm">
              <dt className="flex items-center gap-x-3 text-base font-bold leading-7">
                <Zap className="h-5 w-5 text-accent" />
                High-Conversion Boilerplate
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-text-muted">
                <p className="flex-auto text-sm">
                  Optimized for performance with clean server components layouts, automatic background autosaving mechanics, dynamic theme providers, and pre-packaged global monetisation integration wrappers.
                </p>
              </dd>
            </div>
          </dl>
        </div>
      </section>
    </main>
  );
}
