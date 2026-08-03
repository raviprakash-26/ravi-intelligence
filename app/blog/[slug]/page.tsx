import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Clock, Calendar, BookOpen, List, ChevronDown } from "lucide-react";
import { AnnouncementBar, Navbar, Footer } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TableOfContents } from "@/components/blog/table-of-contents";
import { ShareButtons } from "@/components/blog/share-buttons";
import { ArticleCard } from "@/components/common/cards";
import { getArticleBySlug, getAllArticles } from "@/lib/content";
import { ArticleSchema, BreadcrumbsSchema } from "@/components/common/seo";
import { compileMDX } from "next-mdx-remote/rsc";
import { mdxComponentsList } from "@/components/blog/mdx-components";
import { ReadingProgressBar, ScrollToTop } from "@/components/blog/reading-aids";
import { NextPrevNav } from "@/components/blog/next-prev-nav";
import { NewsletterForm } from "@/components/ui/newsletter-form";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  // Compile MDX on the server side
  const { content: mdxContent } = await compileMDX({
    source: article.content,
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug],
      },
    },
    components: mdxComponentsList,
  });

  const allArticlesList = await getAllArticles();

  // Fetch exactly 3 related articles (same category first, pad with latest if needed)
  const related = allArticlesList
    .filter((a) => a.id !== article.id && a.category === article.category)
    .slice(0, 3);
  
  const recommendations = related.length >= 3 
    ? related 
    : [
        ...related,
        ...allArticlesList.filter((a) => a.id !== article.id && a.category !== article.category)
      ].slice(0, 3);

  // SEO Breadcrumbs Schema URLs
  const breadcrumbsList = [
    { name: "Home", item: "https://ravi-intelligence.com" },
    { name: "Blog", item: "https://ravi-intelligence.com/blog" },
    { name: article.title, item: `https://ravi-intelligence.com/blog/${article.slug}` }
  ];

  // Difficulty badge colors
  const getDifficultyColor = (diff?: string) => {
    switch (diff?.toLowerCase()) {
      case "beginner":
      case "easy":
        return "text-green-700 bg-green-50 dark:text-green-300 dark:bg-green-950/30 border-green-200 dark:border-green-900/50";
      case "intermediate":
      case "medium":
        return "text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50";
      case "advanced":
      case "hard":
        return "text-rose-700 bg-rose-50 dark:text-rose-300 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50";
      default:
        return "text-primary bg-primary/5 border-primary/10";
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Reading Progress Bar */}
      <ReadingProgressBar />

      <AnnouncementBar />
      <Navbar />

      {/* Structured SEO schemas */}
      <ArticleSchema
        title={article.title}
        description={article.excerpt}
        coverImage={article.coverImage}
        datePublished={article.publishedAt}
        authorName={article.author.name}
        url={`https://ravi-intelligence.com/blog/${article.slug}`}
      />
      <BreadcrumbsSchema items={breadcrumbsList} />

      <main className="flex-grow py-10 px-4 sm:px-6 lg:px-8 bg-slate-50/50 dark:bg-transparent">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumbs Navigation */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-6 select-none max-w-5xl mx-auto">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <Link href="/blog" className="hover:text-primary transition-colors">Blog</Link>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <span className="text-slate-450">{article.category}</span>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <span className="text-foreground font-semibold truncate max-w-[200px] sm:max-w-xs">{article.title}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-5xl mx-auto">
            {/* Main Reading Column */}
            <article className="lg:col-span-8 space-y-6">
              {/* Header Info */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2 select-none">
                  <Badge variant="primary" className="font-bold py-0.5 uppercase tracking-wide">
                    {article.category}
                  </Badge>
                  {article.difficulty && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getDifficultyColor(article.difficulty)}`}>
                      {article.difficulty}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3.5xl font-black text-foreground tracking-tight leading-tight select-text">
                  {article.title}
                </h1>
                <p className="text-sm sm:text-base text-slate-550 dark:text-slate-400 font-medium leading-relaxed italic border-l-2 border-primary/50 pl-4 py-1 select-text">
                  {article.excerpt}
                </p>
              </div>

              {/* Social Share & Reading stats (Top boundary) */}
              <div className="border-t border-b border-border/40 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none text-xs text-slate-500">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    Published: {article.publishedAt}
                  </span>
                  {article.lastUpdated && article.lastUpdated !== article.publishedAt && (
                    <span className="flex items-center gap-1 font-semibold text-primary/80">
                      Last Updated: {article.lastUpdated}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    {article.readingTime} min read
                  </span>
                </div>
                <ShareButtons title={article.title} />
              </div>

              {/* Mobile Collapsible TOC Accordion */}
              <div className="lg:hidden my-6 border border-border rounded-xl bg-card overflow-hidden select-none">
                <details className="group">
                  <summary className="w-full px-5 py-4 flex items-center justify-between font-bold text-xs text-foreground cursor-pointer list-none select-none [&::-webkit-details-marker]:hidden">
                    <span className="flex items-center gap-2">
                      <List className="h-4 w-4 text-primary" />
                      Table of Contents
                    </span>
                    <ChevronDown className="h-4 w-4 text-slate-400 group-open:rotate-180 transition-transform duration-200" />
                  </summary>
                  <div className="px-5 py-4 border-t border-border/80 bg-slate-50/20 dark:bg-slate-900/5">
                    <TableOfContents content={article.content} />
                  </div>
                </details>
              </div>

              {/* Formatted body text (MDX Compiled output) */}
              <div className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-350 space-y-5 text-sm sm:text-base leading-relaxed">
                {mdxContent}
              </div>

              {/* Clickable Tags */}
              {article.tags && article.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-6 select-none">
                  <span className="text-xs font-bold text-slate-450 uppercase mr-1">Tags:</span>
                  {article.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350 border border-border"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Reading Completion Congratulations Card */}
              {recommendations[0] && (
                <div className="p-6 my-8 rounded-xl border border-primary/20 bg-primary/5 dark:bg-primary/10 select-none space-y-3.5 max-w-xl mx-auto text-center">
                  <h4 className="font-extrabold text-sm text-foreground flex items-center justify-center gap-1.5">
                    <span>🎉</span>
                    <span>Congratulations on finishing this guide!</span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal max-w-md mx-auto">
                    Ready to take the next step? Keep building your skillset with this recommended next publication:
                  </p>
                  <Link
                    href={`/blog/${recommendations[0].slug}`}
                    className="inline-flex items-center gap-1 font-bold text-xs text-primary hover:underline hover:scale-101 transition-transform"
                  >
                    <span>{recommendations[0].title}</span>
                    <span>&rarr;</span>
                  </Link>
                </div>
              )}

              {/* Next / Previous Article Navigation */}
              <NextPrevNav currentArticleId={article.id} articles={allArticlesList} />

              {/* Newsletter Subscription CTA */}
              <div className="p-8 my-10 rounded-2xl border border-border bg-slate-50 dark:bg-slate-900/10 select-none space-y-6 max-w-2xl mx-auto">
                <div className="text-center space-y-2">
                  <h3 className="font-black text-lg sm:text-xl text-foreground">Stay Updated with Ravi Intelligence</h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-normal max-w-md mx-auto">
                    Subscribe to receive expert analytical breakdowns, generative AI templates, and spreadsheet cheat sheets directly in your inbox.
                  </p>
                </div>
                <div className="max-w-md mx-auto">
                  <NewsletterForm />
                </div>
              </div>

              {/* Comments Placeholder */}
              <div className="border-t border-border mt-12 pt-8 space-y-4 select-none">
                <h3 className="text-lg font-bold text-foreground">Comments (0)</h3>
                <div className="p-6 rounded-xl border border-border bg-slate-50 dark:bg-slate-900/40 text-center text-slate-500 text-xs">
                  Reader comments are disabled for guest accounts. Please sign in or join a membership plan in the future to comment.
                </div>
              </div>
            </article>

            {/* Sticky Sidebar (Desktop only) */}
            <aside className="lg:col-span-4 space-y-6">
              {/* Author Bio Card */}
              <Card className="p-5 space-y-4 bg-card select-none">
                <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider border-b border-border/40 pb-2">
                  Written By
                </h4>
                <div className="flex items-center gap-3">
                  <img
                    src={article.author.avatar}
                    alt={article.author.name}
                    className="h-11 w-11 rounded-full border border-border"
                  />
                  <div>
                    <h5 className="font-bold text-sm text-foreground">{article.author.name}</h5>
                    <p className="text-[11px] text-slate-500 mt-1">{article.author.role}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed pt-2">
                  {article.author.bio}
                </p>
              </Card>

              {/* Table of Contents Sticky Box */}
              <div className="sticky top-24 space-y-6">
                <Card className="p-5 bg-card hidden lg:block">
                  <TableOfContents content={article.content} />
                </Card>
              </div>
            </aside>
          </div>

          {/* Related Articles Footer Section (Always shows 3 related posts) */}
          <div className="border-t border-border/40 pt-12 mt-12 space-y-6 max-w-5xl mx-auto">
            <h3 className="text-xl font-extrabold text-foreground select-none">Recommended Publications</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((rec) => (
                <ArticleCard key={rec.id} article={rec} />
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Floating Scroll To Top button */}
      <ScrollToTop />
    </div>
  );
}

export async function generateStaticParams() {
  const articlesList = await getAllArticles();
  return articlesList.map((a) => ({
    slug: a.slug,
  }));
}
