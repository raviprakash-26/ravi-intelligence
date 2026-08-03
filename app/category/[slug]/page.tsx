import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Sparkles, FileText, ShoppingBag, BookOpen } from "lucide-react";
import { AnnouncementBar, Navbar, Footer } from "@/components/layout";
import { getAllArticles } from "@/lib/content";
import { getAllResources } from "@/lib/resources";
import { getAllPaths } from "@/lib/learn";
import { getAllPrompts } from "@/lib/prompts";
import { ArticleCard, RoadmapCard } from "@/components/common/cards";
import { ResourceCard } from "@/components/resources/resource-components";
import { PromptCard } from "@/components/prompts/prompt-components";
import { BreadcrumbsSchema } from "@/components/common/seo";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;

  const [articles, resources, paths, prompts] = await Promise.all([
    getAllArticles(),
    getAllResources(),
    getAllPaths(),
    getAllPrompts(),
  ]);

  // Case-insensitive match on category slug
  const matchedArticles = articles.filter((a) => a.category.toLowerCase().split(" ").join("-") === slug);
  const matchedResources = resources.filter((r) => r.category.toLowerCase().split(" ").join("-") === slug);
  const matchedPaths = paths.filter((p) => p.category.toLowerCase().split(" ").join("-") === slug);
  const matchedPrompts = prompts.filter((pr) => pr.category.toLowerCase().split(" ").join("-") === slug);

  const totalCount = matchedArticles.length + matchedResources.length + matchedPaths.length + matchedPrompts.length;

  if (totalCount === 0) {
    notFound();
  }

  // Get raw category name from matches
  const categoryName =
    matchedArticles[0]?.category ||
    matchedResources[0]?.category ||
    matchedPaths[0]?.category ||
    matchedPrompts[0]?.category ||
    slug;

  const breadcrumbsList = [
    { name: "Home", item: "https://ravi-intelligence.com" },
    { name: "Categories", item: "https://ravi-intelligence.com/category" },
    { name: categoryName, item: `https://ravi-intelligence.com/category/${slug}` }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <AnnouncementBar />
      <Navbar />

      <BreadcrumbsSchema items={breadcrumbsList} />

      <main className="flex-grow py-10 px-4 sm:px-6 lg:px-8 bg-slate-50/30 dark:bg-transparent">
        <div className="max-w-5xl mx-auto space-y-12">
          
          {/* Breadcrumb line */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium select-none">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <span className="text-slate-455">Categories</span>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <span className="text-foreground font-semibold">{categoryName}</span>
          </nav>

          {/* Header titles */}
          <div className="space-y-2 select-none border-b border-border/40 pb-6">
            <div className="inline-flex items-center gap-1 bg-primary/5 text-primary border border-primary/10 rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              Category Directory
            </div>
            <h1 className="text-2xl sm:text-3.5xl font-black text-foreground tracking-tight leading-tight">
              Subject Overview: {categoryName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
              Discover articles, interactive paths, cheatsheets, and prompt shortcuts categorized under {categoryName}.
            </p>
          </div>

          {/* 1. Learning Paths segment */}
          {matchedPaths.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-base sm:text-lg text-foreground flex items-center gap-1.5 border-b border-border/30 pb-2 select-none">
                <BookOpen className="h-4.5 w-4.5 text-purple-500" />
                <span>Learning Courses</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {matchedPaths.map((p) => (
                  <RoadmapCard key={p.id} path={p} />
                ))}
              </div>
            </div>
          )}

          {/* 2. Resources marketplace segment */}
          {matchedResources.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-base sm:text-lg text-foreground flex items-center gap-1.5 border-b border-border/30 pb-2 select-none">
                <ShoppingBag className="h-4.5 w-4.5 text-emerald-500" />
                <span>Templates & Workbooks</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {matchedResources.map((res) => (
                  <ResourceCard key={res.id} resource={res} />
                ))}
              </div>
            </div>
          )}

          {/* 3. Prompts segment */}
          {matchedPrompts.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-base sm:text-lg text-foreground flex items-center gap-1.5 border-b border-border/30 pb-2 select-none">
                <Sparkles className="h-4.5 w-4.5 text-amber-500" />
                <span>AI Prompt Templates</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {matchedPrompts.map((pr) => (
                  <PromptCard key={pr.id} prompt={pr} />
                ))}
              </div>
            </div>
          )}

          {/* 4. Articles blog segment */}
          {matchedArticles.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-base sm:text-lg text-foreground flex items-center gap-1.5 border-b border-border/30 pb-2 select-none">
                <FileText className="h-4.5 w-4.5 text-blue-500" />
                <span>Tutorial Publications</span>
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
  const [articles, resources, paths, prompts] = await Promise.all([
    getAllArticles(),
    getAllResources(),
    getAllPaths(),
    getAllPrompts(),
  ]);

  const slugs = new Set<string>();
  
  articles.forEach((a) => slugs.add(a.category.toLowerCase().split(" ").join("-")));
  resources.forEach((r) => slugs.add(r.category.toLowerCase().split(" ").join("-")));
  paths.forEach((p) => slugs.add(p.category.toLowerCase().split(" ").join("-")));
  prompts.forEach((pr) => slugs.add(pr.category.toLowerCase().split(" ").join("-")));

  return Array.from(slugs).map((s) => ({
    slug: s,
  }));
}
