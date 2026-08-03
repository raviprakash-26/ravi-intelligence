import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Clock, Calendar, List, ChevronDown } from "lucide-react";
import { AnnouncementBar, Navbar, Footer } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TableOfContents } from "@/components/blog/table-of-contents";
import { ShareButtons } from "@/components/blog/share-buttons";
import { ShareToolbar } from "@/components/blog/share-toolbar";
import { getArticleBySlug, getAllArticles } from "@/lib/content";
import { ArticleSchema, BreadcrumbsSchema } from "@/components/common/seo";
import { compileMDX } from "next-mdx-remote/rsc";
import { mdxComponentsList } from "@/components/blog/mdx-components";
import { ReadingProgressBar, ScrollToTop } from "@/components/blog/reading-aids";
import { NextPrevNav } from "@/components/blog/next-prev-nav";
import { NewsletterForm } from "@/components/ui/newsletter-form";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { Download } from "@/components/blog/mdx-components";

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
        return "text-green-700 bg-green-50 dark:text-green-350 dark:bg-green-950/20 border-green-200 dark:border-green-900/50";
      case "intermediate":
      case "medium":
        return "text-amber-700 bg-amber-50 dark:text-amber-350 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50";
      case "advanced":
      case "hard":
        return "text-rose-700 bg-rose-50 dark:text-rose-350 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50";
      default:
        return "text-primary bg-primary/5 border-primary/10";
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Reading Progress Bar */}
      <ReadingProgressBar />

      {/* 2. Floating Share Toolbar (Vertical on left, horizontal floating bottom on mobile) */}
      <ShareToolbar title={article.title} />

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

      <main className="flex-grow py-10 px-4 sm:px-6 lg:px-8 bg-slate-50/30 dark:bg-transparent">
        <div className="max-w-7xl mx-auto">
          
          {/* ========================================================
              1. ARTICLE HERO (Redesigned Header Layout)
              ======================================================== */}
          <header className="max-w-3xl mx-auto space-y-6 pt-8 pb-10 select-none">
            {/* Breadcrumbs Navigation */}
            <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Link href="/" className="hover:text-primary transition-colors">Home</Link>
              <ChevronRight className="h-3 w-3 text-slate-400" />
              <Link href="/blog" className="hover:text-primary transition-colors">Blog</Link>
              <ChevronRight className="h-3 w-3 text-slate-400" />
              <span className="text-slate-455">{article.category}</span>
            </nav>

            {/* Category and Difficulty */}
            <div className="flex items-center gap-2.5">
              <Badge variant="primary" className="font-bold py-0.5 uppercase tracking-wide text-[10px]">
                {article.category}
              </Badge>
              {article.difficulty && (
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getDifficultyColor(article.difficulty)}`}>
                  {article.difficulty}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4.5xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight select-text">
              {article.title}
            </h1>

            {/* Excerpt */}
            <p className="text-base sm:text-lg text-slate-550 dark:text-slate-400 leading-relaxed font-medium select-text">
              {article.excerpt}
            </p>

            {/* Author & Time Metadata */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-4 pt-5 text-xs text-slate-500 border-t border-border/40">
              <div className="flex items-center gap-3">
                <img
                  src={article.author.avatar}
                  alt={article.author.name}
                  className="h-10 w-10 rounded-full border border-border"
                />
                <div>
                  <p className="font-bold text-foreground">{article.author.name}</p>
                  <p className="text-[10px] text-slate-500 leading-none mt-1">{article.author.role}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 sm:border-l sm:border-border/60 sm:pl-6 h-8 text-[11px] sm:text-xs">
                <div className="flex flex-col">
                  <span className="text-slate-400 font-medium">Published</span>
                  <span className="font-semibold text-foreground">{article.publishedAt}</span>
                </div>
                {article.lastUpdated && article.lastUpdated !== article.publishedAt && (
                  <div className="flex flex-col">
                    <span className="text-slate-400 font-medium">Updated</span>
                    <span className="font-semibold text-primary">{article.lastUpdated}</span>
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-slate-400 font-medium">Read Time</span>
                  <span className="font-semibold text-foreground">{article.readingTime} min read</span>
                </div>
              </div>
            </div>
          </header>

          {/* Large Featured Image */}
          <div className="max-w-4xl mx-auto rounded-2xl border border-border overflow-hidden shadow-lg select-none mb-12 aspect-video md:aspect-[21/9]">
            <img
              src={article.coverImage}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* ========================================================
              2. TYPOGRAPHY & LAYOUT COLUMN (Stripe/Linear max-width)
              ======================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-5xl mx-auto">
            
            {/* Left Content column */}
            <div className="lg:col-span-8 space-y-8 max-w-2xl lg:max-w-none">
              
              {/* Mobile Table of Contents Accordion */}
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

              {/* MDX Body text constrained to comfortable 720px width */}
              <div className="max-w-[720px] mx-auto prose prose-slate dark:prose-invert text-slate-700 dark:text-slate-350 space-y-6 sm:text-[17px] leading-relaxed select-text">
                {mdxContent}
              </div>

              {/* Clickable Tags */}
              {article.tags && article.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-8 select-none max-w-[720px] mx-auto">
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

              {/* Reusable File Download Card (Rendered automatically if download key present in metadata) */}
              {article.download && (
                <div className="pt-8 border-t border-border/40 max-w-[720px] mx-auto">
                  <Download
                    title={`${article.title} Practice Asset`}
                    url={article.download}
                  />
                </div>
              )}

              {/* Reading Completion congratulations card */}
              {recommendations[0] && (
                <div className="p-6 sm:p-8 my-10 rounded-xl border border-primary/20 bg-primary/5 dark:bg-primary/10 select-none space-y-4 max-w-2xl mx-auto text-center">
                  <div className="text-xs font-bold text-primary uppercase tracking-widest leading-none">Congratulations!</div>
                  <h4 className="font-extrabold text-sm sm:text-base text-foreground">You finished reading this publication.</h4>
                  <p className="text-xs text-slate-550 dark:text-slate-400 leading-normal max-w-md mx-auto">
                    Ready to continue? Take the next step in your analytics training pathway:
                  </p>
                  <div className="pt-1.5 pb-2">
                    <Link
                      href={`/blog/${recommendations[0].slug}`}
                      className="inline-flex items-center gap-1.5 font-bold text-sm text-primary hover:underline hover:scale-101 transition-transform"
                    >
                      <span>{recommendations[0].title}</span>
                      <span>&rarr;</span>
                    </Link>
                  </div>
                  
                  <div className="pt-2 border-t border-border/40 max-w-xs mx-auto">
                    <Link href="/blog" className="inline-block">
                      <button className="h-8 px-4 rounded-lg bg-card border border-border text-[11px] font-bold text-slate-650 hover:bg-slate-100 dark:text-slate-350 dark:hover:bg-slate-800 transition-colors cursor-pointer select-none">
                        Back to Blog Feed
                      </button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Next / Previous Article Navigation */}
              <div className="max-w-[720px] mx-auto">
                <NextPrevNav currentArticleId={article.id} articles={allArticlesList} />
              </div>

              {/* Upgraded Newsletter CTA Card */}
              <div className="p-8 sm:p-10 my-12 rounded-2xl border border-border bg-slate-50 dark:bg-slate-900/10 select-none space-y-6 max-w-2xl mx-auto text-center relative overflow-hidden">
                <div className="absolute -top-12 -left-12 w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none" />
                <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
                
                <div className="space-y-2 relative z-10">
                  <h3 className="font-black text-xl sm:text-2xl text-foreground">Stay Ahead in Analytics & AI</h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
                    Receive weekly tutorials, templates, AI prompts, and career tips.
                  </p>
                </div>
                <div className="max-w-md mx-auto relative z-10">
                  <NewsletterForm />
                </div>
                <p className="text-[10px] sm:text-xs text-slate-455 dark:text-slate-500 select-none relative z-10 leading-none">
                  No spam. Unsubscribe anytime.
                </p>
              </div>

              {/* Comments Placeholder */}
              <div className="border-t border-border mt-12 pt-8 space-y-4 select-none max-w-[720px] mx-auto">
                <h3 className="text-lg font-bold text-foreground">Comments (0)</h3>
                <div className="p-6 rounded-xl border border-border bg-slate-50 dark:bg-slate-900/40 text-center text-slate-500 text-xs">
                  Reader comments are disabled for guest accounts. Please sign in or join a membership plan in the future to comment.
                </div>
              </div>
            </div>

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

          {/* Related Articles Footer Section (Upgraded to premium cards) */}
          <div className="border-t border-border/40 pt-16 mt-16 space-y-8 max-w-5xl mx-auto select-none">
            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-black text-foreground">Related Publications</h3>
              <p className="text-xs text-slate-550 dark:text-slate-450">Continue reading corresponding materials from the Ravi Intelligence hub.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((rec) => (
                <Link href={`/blog/${rec.slug}`} key={rec.id} className="group block">
                  <Card hoverEffect className="overflow-hidden bg-card border border-border h-full flex flex-col justify-between">
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={rec.coverImage}
                        alt={rec.title}
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                      />
                      <div className="absolute top-3 left-3">
                        <Badge variant="primary" className="text-[10px] font-bold py-0.5 px-2 uppercase">{rec.category}</Badge>
                      </div>
                    </div>
                    <div className="p-4 sm:p-5 flex-grow flex flex-col justify-between gap-4">
                      <h4 className="font-extrabold text-sm sm:text-base leading-snug group-hover:text-primary transition-colors text-foreground line-clamp-2">
                        {rec.title}
                      </h4>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-border/30 mt-auto">
                        <span>{rec.publishedAt}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {rec.readingTime} min read
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
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
