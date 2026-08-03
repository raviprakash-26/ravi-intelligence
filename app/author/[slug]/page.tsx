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

export default async function AuthorProfilePage({ params }: PageProps) {
  const { slug } = await params;
  
  const [allArticles, allResources, allPrompts] = await Promise.all([
    getAllArticles(),
    getAllResources(),
    getAllPrompts(),
  ]);
  
  // Find articles matching author slug
  const authorArticles = allArticles.filter((art) => {
    const derivedSlug = art.author.name.toLowerCase().split(" ").join("-");
    return derivedSlug === slug;
  });

  if (authorArticles.length === 0) {
    notFound();
  }

  const authorInfo = authorArticles[0].author;
  const authorName = authorInfo.name;

  // Filter resources & prompts written by this author
  const authorResources = allResources.filter((res) => res.author.toLowerCase() === authorName.toLowerCase());
  const authorPrompts = allPrompts.filter((pr) => pr.author.toLowerCase() === authorName.toLowerCase());

  const breadcrumbsList = [
    { name: "Home", item: "https://ravi-intelligence.com" },
    { name: "Authors", item: "https://ravi-intelligence.com/author" },
    { name: authorName, item: `https://ravi-intelligence.com/author/${slug}` }
  ];

  const authorSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": authorName,
    "jobTitle": authorInfo.role,
    "description": authorInfo.bio,
    "image": authorInfo.avatar
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AnnouncementBar />
      <Navbar />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(authorSchema) }}
      />
      <BreadcrumbsSchema items={breadcrumbsList} />

      <main className="flex-grow py-10 px-4 sm:px-6 lg:px-8 bg-slate-50/30 dark:bg-transparent">
        <div className="max-w-5xl mx-auto space-y-12">
          
          {/* Breadcrumb line */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium select-none">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <span className="text-slate-455">Authors</span>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <span className="text-foreground font-semibold">{authorName}</span>
          </nav>

          {/* Author profile bio panel */}
          <div className="p-6 rounded-2xl border border-border bg-card flex flex-col sm:flex-row gap-5 items-center sm:items-start select-none">
            <img
              src={authorInfo.avatar}
              alt={authorName}
              className="h-16 w-16 rounded-full border object-cover shadow-sm bg-slate-100 dark:bg-slate-900"
            />
            <div className="space-y-3 text-center sm:text-left">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-foreground leading-tight">
                  {authorName}
                </h1>
                <p className="text-xs font-bold text-primary uppercase tracking-wide">
                  {authorInfo.role}
                </p>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
                {authorInfo.bio}
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-3 pt-1 select-none">
                <Link href="https://twitter.com/raviprakash" target="_blank" className="text-slate-400 hover:text-primary transition-colors" aria-label="Twitter X Link">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </Link>
                <Link href="https://linkedin.com/in/raviprakash" target="_blank" className="text-slate-400 hover:text-primary transition-colors" aria-label="LinkedIn Link">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </Link>
                <Link href="https://github.com/raviprakash" target="_blank" className="text-slate-400 hover:text-primary transition-colors" aria-label="GitHub Link">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.82 1.102.82 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.3 24 12c0-6.63-5.37-12-12-12z"/></svg>
                </Link>
              </div>
            </div>
          </div>

          {/* Grid list of resources */}
          {authorResources.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-base sm:text-lg text-foreground flex items-center gap-1.5 border-b border-border/30 pb-2 select-none">
                <ShoppingBag className="h-4.5 w-4.5 text-emerald-500" />
                <span>Templates & Assets by {authorName}</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {authorResources.map((res) => (
                  <ResourceCard key={res.id} resource={res} />
                ))}
              </div>
            </div>
          )}

          {/* Grid list of prompts */}
          {authorPrompts.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-base sm:text-lg text-foreground flex items-center gap-1.5 border-b border-border/30 pb-2 select-none">
                <Sparkles className="h-4.5 w-4.5 text-amber-500" />
                <span>AI Prompt Sheets by {authorName}</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {authorPrompts.map((pr) => (
                  <PromptCard key={pr.id} prompt={pr} />
                ))}
              </div>
            </div>
          )}

          {/* Grid list of articles */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-base sm:text-lg text-foreground flex items-center gap-1.5 border-b border-border/30 pb-2 select-none">
              <FileText className="h-4.5 w-4.5 text-blue-500" />
              <span>Articles by {authorName}</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {authorArticles.map((art) => (
                <ArticleCard key={art.id} article={art} />
              ))}
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}

export async function generateStaticParams() {
  const allArticles = await getAllArticles();
  const slugs = Array.from(
    new Set(
      allArticles.map((art) => art.author.name.toLowerCase().split(" ").join("-"))
    )
  );

  return slugs.map((s) => ({
    slug: s,
  }));
}
