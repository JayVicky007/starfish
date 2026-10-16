// "use client";

// import type { SearchSuggestion } from "@/utils/movieService";

// export default function SearchSuggestions({
//   suggestions,
//   isLoading,
//   onSelect,
//   className = "absolute left-0 right-0 top-full z-50 mt-2",
// }: {
//   suggestions: SearchSuggestion[];
//   isLoading: boolean;
//   onSelect: (suggestion: SearchSuggestion) => void;
//   className?: string;
// }) {
//   if (!isLoading && suggestions.length === 0) {
//     return null;
//   }

//   return (
//     <div className={`${className} overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 text-left shadow-2xl`}>
//       {isLoading ? (
//         <p className="px-3 py-2 text-sm text-slate-400">Finding something good...</p>
//       ) : (
//         suggestions.map((suggestion) => (
//           <button
//             key={`${suggestion.mediaType}-${suggestion.id}`}
//             type="button"
//             onClick={() => onSelect(suggestion)}
//             className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-slate-100"
//           >
//             <span className="flex h-10 w-8 shrink-0 items-center justify-center overflow-hidden rounded bg-slate-100 text-[10px] text-slate-400">
//               {suggestion.posterPath ? (
//                 <img
//                   src={`https://image.tmdb.org/t/p/w92${suggestion.posterPath}`}
//                   alt=""
//                   className="h-full w-full object-cover"
//                 />
//               ) : "?"}
//             </span>
//             <span className="min-w-0">
//               <span className="block truncate font-semibold text-slate-900">{suggestion.title}</span>
//               <span className="block text-xs text-slate-400">{suggestion.mediaType}</span>
//             </span>
//           </button>
//         ))
//       )}
//     </div>
//   );
// }


"use client";

import { FileText, Terminal, Layers, ShieldAlert, Cpu } from "lucide-react";

export type SearchSuggestion = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  mediaType: string;
};

const topicLabels: Record<string, string> = {
  saas: "SaaS & Architecture",
  ai: "AI & Automation",
  devops: "DevOps & Infosec",
  design: "Design Systems",
};

function getTopicIcon(mediaType: string) {
  if (mediaType === "saas") return <Layers className="h-4 w-4 text-accent" />;
  if (mediaType === "ai") return <Cpu className="h-4 w-4 text-emerald-400" />;
  if (mediaType === "devops") return <ShieldAlert className="h-4 w-4 text-rose-400" />;
  if (mediaType === "design") return <Terminal className="h-4 w-4 text-blue-400" />;
  return <FileText className="h-4 w-4 text-text-muted" />;
}

export default function SearchSuggestions({
  suggestions,
  isLoading,
  onSelect,
  className = "absolute left-0 right-0 top-full z-50 mt-2",
}: {
  suggestions: SearchSuggestion[];
  isLoading: boolean;
  onSelect: (suggestion: SearchSuggestion) => void;
  className?: string;
}) {
  if (!isLoading && suggestions.length === 0) {
    return null;
  }

  return (
    <div className={`${className} overflow-hidden rounded-2xl border border-text-muted/15 bg-surface p-2 text-left shadow-2xl`}>
      {isLoading ? (
        <div className="flex items-center gap-3 px-3 py-3 animate-pulse">
          <div className="h-8 w-8 shrink-0 rounded-lg bg-text-muted/20" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-text-muted/20" />
            <div className="h-3 w-1/4 rounded bg-text-muted/20" />
          </div>
        </div>
      ) : (
        suggestions.map((suggestion) => {
          const displayTopic = topicLabels[suggestion.mediaType] || "General Technical";
          
          return (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => onSelect(suggestion)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-accent/10 group/item"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-background border border-text-muted/10 transition-colors group-hover/item:border-accent/30">
                {getTopicIcon(suggestion.mediaType)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-foreground group-hover/item:text-accent transition-colors">
                  {suggestion.title}
                </span>
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-text-muted mt-0.5">
                  {displayTopic}
                </span>
              </span>
            </button>
          );
        })
      )}
    </div>
  );
}
