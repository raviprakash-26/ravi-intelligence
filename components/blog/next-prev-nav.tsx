import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { MdxArticle } from "@/types";

interface NextPrevNavProps {
  currentArticleId: string;
  articles: MdxArticle[];
}

export function NextPrevNav({ currentArticleId, articles }: NextPrevNavProps) {
  // Find the index of the current article
  const currentIndex = articles.findIndex((a) => a.id === currentArticleId);
  if (currentIndex === -1) return null;

  // articles are sorted descending (newest first). 
  // An older post is "previous" (index + 1) and a newer post is "next" (index - 1)
  const nextArticle = currentIndex > 0 ? articles[currentIndex - 1] : null;
  const prevArticle = currentIndex < articles.length - 1 ? articles[currentIndex + 1] : null;

  if (!nextArticle && !prevArticle) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-b border-border/40 py-8 my-8 select-none">
      {prevArticle ? (
        <Link href={`/blog/${prevArticle.slug}`} className="group block text-left">
          <div className="p-4 rounded-xl border border-border bg-card hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-all flex flex-col justify-between h-full space-y-2.5">
            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest inline-flex items-center gap-1 leading-none">
              <ArrowLeft className="h-3 w-3 group-hover:-translate-x-0.5 transition-transform" />
              Previous Post
            </span>
            <span className="text-sm font-extrabold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
              {prevArticle.title}
            </span>
          </div>
        </Link>
      ) : (
        <div className="hidden sm:block" />
      )}

      {nextArticle ? (
        <Link href={`/blog/${nextArticle.slug}`} className="group block text-right">
          <div className="p-4 rounded-xl border border-border bg-card hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-all flex flex-col justify-between h-full space-y-2.5 items-end">
            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest inline-flex items-center gap-1 leading-none">
              Next Post
              <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
            <span className="text-sm font-extrabold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
              {nextArticle.title}
            </span>
          </div>
        </Link>
      ) : (
        <div className="hidden sm:block" />
      )}
    </div>
  );
}
