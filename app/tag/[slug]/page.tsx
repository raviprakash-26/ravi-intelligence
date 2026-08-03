import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, FileText, ShoppingBag, Sparkles } from "lucide-react";
import { AnnouncementBar, Navbar, Footer } from "@/components/layout";
import { getAllArticles } from "@/lib/content";
import { getAllResources } from "@/lib/resources";
import { getAllPrompts } from "@/lib/prompts";
import { ArticleCard } from "@/components/common/cards";
import { ResourceCard } from "@/components/resources/resource-components";
import { PromptCard } from "@/components/prompts/prompt-components";
import { BreadcrumbsSchema } from "@/components/common/seo";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function TagPage({ params }: PageProps) {
  const { slug } = await params;

  const [articles, resources, prompts] = await Promise.all([
    getAllArticles(),
    getAllResources(),
    getAllPrompts(),
  ]);

  // Case-insensitive match on tags
  const matchedArticles = articles.filter((a) =>
    a.tags.some((t) => t.toLowerCase().split(" ").join("-") === slug)
  );
  const matchedResources = resources.filter((r) =>
    r.tags.some((t) => t.toLowerCase().split(" ").join("-") === slug)
  );
  const matchedPrompts = prompts.filter((p) =>
    p.tags.some((t) => t.toLowerCase().split(" ").join("-") === slug)
  );

  const totalCount = matchedArticles.length + matchedResources.length + matchedPrompts.length;

  if (totalCount === 0) {
    notFound();
  }

  // Find correct raw tag casing
  let tagName = slug;
  const sampleArt = matchedArticles.find((a) => a.tags.some((t) => t.toLowerCase().split(" ").join("-") === slug));
  if (sampleArt) {
    tagName = sampleArt.tags.find((t) => t.toLowerCase().split(" ").join("-") === slug) || slug;
  } else {
    const sampleRes = matchedResources.find((r) => r.tags.some((t) => t.toLowerCase().split(" ").join("-") === slug));
    if (sampleRes) {
      tagName = sampleRes.tags.find((t) => t.toLowerCase().split(" ").join("-") === slug) || slug;
    } else {
      const samplePr = matchedPrompts.find((p) => p.tags.some((t) => t.toLowerCase().split(" ").join("-") === slug));
      if (samplePr) {
        tagName = samplePr.tags.find((t) => t.toLowerCase().split(" ").join("-") === slug) || slug;
      }
    }
  }

  const breadcrumbsList = [
    { name: "Home", item: "https://ravi-intelligence.com" },
    { name: "Tags", item: "https://ravi-intelligence.com/tag" },
    { name: tagName, item: `https://ravi-intelligence.com/tag/${slug}` }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <AnnouncementBar />
      <Navbar />

      <BreadcrumbsSchema items={breadcrumbsList} />

      <main className="flex-grow py-10 px-4 sm:px-6 lg:px-8 bg-slate-50/30 dark:bg-transparent">
        <div className="max-w-5xl mx-auto space-y-12">
          
          {/* Breadcrumbs navigation */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium select-none">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <span className="text-slate-455">Tags</span>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <span className="text-foreground font-semibold">#{tagName}</span>
          </nav>

          {/* Header titles */}
          <div className="space-y-2 select-none border-b border-border/40 pb-6">
            <div className="inline-flex items-center gap-1 bg-primary/5 text-primary border border-primary/10 rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              Keyword Filter
            </div>
            <h1 className="text-2xl sm:text-3.5xl font-black text-foreground tracking-tight leading-tight">
              Tag Archives: #{tagName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
              Browse publication guides, sheets, and prompts tagged under #{tagName}.
            </p>
          </div>

          {/* 1. Resources segment */}
          {matchedResources.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-base sm:text-lg text-foreground flex items-center gap-1.5 border-b border-border/30 pb-2 select-none">
                <ShoppingBag className="h-4.5 w-4.5 text-emerald-500" />
                <span>Resources & Sheets</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {matchedResources.map((res) => (
                  <ResourceCard key={res.id} resource={res} />
                ))}
              </div>
            </div>
          )}

          {/* 2. Prompts segment */}
          {matchedPrompts.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-base sm:text-lg text-foreground flex items-center gap-1.5 border-b border-border/30 pb-2 select-none">
                <Sparkles className="h-4.5 w-4.5 text-amber-500" />
                <span>AI Prompts</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {matchedPrompts.map((p) => (
                  <PromptCard key={p.id} prompt={p} />
                ))}
              </div>
            </div>
          )}

          {/* 3. Articles segment */}
          {matchedArticles.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-base sm:text-lg text-foreground flex items-center gap-1.5 border-b border-border/30 pb-2 select-none">
                <FileText className="h-4.5 w-4.5 text-blue-500" />
                <span>Articles</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {matchedArticles.map((art) => (
                  <ArticleCard key={art.id} article={art} />
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}

export async function generateStaticParams() {
  const [articles, resources, prompts] = await Promise.all([
    getAllArticles(),
    getAllResources(),
    getAllPrompts(),
  ]);

  const slugs = new Set<string>();
  
  articles.forEach((a) => a.tags.forEach((t) => slugs.add(t.toLowerCase().split(" ").join("-"))));
  resources.forEach((r) => r.tags.forEach((t) => slugs.add(t.toLowerCase().split(" ").join("-"))));
  prompts.forEach((p) => p.tags.forEach((t) => slugs.add(t.toLowerCase().split(" ").join("-"))));

  return Array.from(slugs).map((s) => ({
    slug: s,
  }));
}
