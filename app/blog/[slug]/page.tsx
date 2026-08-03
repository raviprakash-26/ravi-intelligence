import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Clock } from "lucide-react";
import { AnnouncementBar, Navbar, Footer } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TableOfContents } from "@/components/blog/table-of-contents";
import { ShareButtons } from "@/components/blog/share-buttons";
import { ArticleCard } from "@/components/common/cards";
import { getArticleBySlug, getAllArticles } from "@/lib/content";
import { ArticleSchema, BreadcrumbsSchema } from "@/components/common/seo";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const allArticlesList = await getAllArticles();

  // Fetch 2 related articles
  const relatedArticles = allArticlesList
    .filter((a) => a.id !== article.id && (a.category === article.category || a.tags.some(t => article.tags.includes(t))))
    .slice(0, 2);

  // Fallback to general articles if no exact category match
  const recommendations = relatedArticles.length > 0 
    ? relatedArticles 
    : allArticlesList.filter(a => a.id !== article.id).slice(0, 2);

  const breadcrumbs = [
    { name: "Home", item: "https://ravi-intelligence.com" },
    { name: "Blog", item: "https://ravi-intelligence.com/blog" },
    { name: article.title, item: `https://ravi-intelligence.com/blog/${article.slug}` }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <AnnouncementBar />
      <Navbar />
      <ArticleSchema
        title={article.title}
        description={article.excerpt}
        coverImage={article.coverImage}
        datePublished={article.publishedAt}
        authorName={article.author.name}
        url={`https://ravi-intelligence.com/blog/${article.slug}`}
      />
      <BreadcrumbsSchema items={breadcrumbs} />

      <main className="flex-grow py-10 px-4 sm:px-6 lg:px-8 bg-slate-50/40 dark:bg-transparent">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1 text-xs text-slate-500 select-none">
            <Link href="/" className="hover:underline">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/blog" className="hover:underline">Blog</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-semibold truncate max-w-[200px]">
              {article.title}
            </span>
          </nav>

          {/* Banner cover */}
          <div className="aspect-[21/9] w-full rounded-2xl overflow-hidden border border-border select-none">
            <img
              src={article.coverImage}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main content column */}
            <article className="lg:col-span-8 space-y-6">
              {/* Heading Metadata */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="primary" className="font-bold">{article.category}</Badge>
                  <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {article.readingTime} min read
                  </span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
                  {article.title}
                </h1>
                <p className="text-sm sm:text-base text-slate-550 dark:text-slate-400 font-medium leading-relaxed italic border-l-2 border-primary/50 pl-4 py-1">
                  {article.excerpt}
                </p>
              </div>

              {/* Social Share (Top boundary) */}
              <div className="border-t border-b border-border/40 py-3.5 flex items-center justify-between">
                <div className="text-xs text-slate-500 font-mono">Published: {article.publishedAt}</div>
                <ShareButtons title={article.title} />
              </div>

              {/* Formatted body text */}
              <div className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-350 space-y-5 text-sm sm:text-base leading-relaxed">
                <div
                  dangerouslySetInnerHTML={{
                    __html: article.content
                      .replace(/\n\n/g, "<p className='mb-4'></p>")
                      .replace(/### (.*)/g, (match, p1) => {
                        const id = p1.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                        return `<h3 id="${id}" class="text-lg sm:text-xl font-bold text-foreground mt-6 mb-2 scroll-mt-20">${p1}</h3>`;
                      })
                      .replace(/## (.*)/g, (match, p1) => {
                        const id = p1.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                        return `<h2 id="${id}" class="text-xl sm:text-2xl font-extrabold text-foreground mt-8 mb-3 border-b border-border/40 pb-2 scroll-mt-20">${p1}</h2>`;
                      })
                      .replace(/> \[!TIP\]\n> (.*)/g, "<div class='p-4 border-l-4 border-l-emerald-500 bg-emerald-500/5 text-emerald-950 dark:text-emerald-200 my-4 rounded-r-lg'><strong>Tip:</strong> $1</div>")
                      .replace(/> \[!IMPORTANT\]\n> (.*)/g, "<div class='p-4 border-l-4 border-l-blue-500 bg-blue-500/5 text-blue-950 dark:text-blue-200 my-4 rounded-r-lg'><strong>Important:</strong> $1</div>")
                      .replace(/`([^`]+)`/g, "<code class='px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-primary text-xs font-mono border border-border/60'>$1</code>")
                      .replace(/```sql\n([\s\S]*?)```/g, "<pre class='p-4 bg-slate-950 text-slate-200 rounded-xl font-mono text-xs overflow-x-auto leading-normal my-4 border border-white/5'>$1</pre>")
                      .replace(/```dax\n([\s\S]*?)```/g, "<pre class='p-4 bg-slate-950 text-slate-200 rounded-xl font-mono text-xs overflow-x-auto leading-normal my-4 border border-white/5'>$1</pre>")
                      .replace(/\$\$(.*?)\$\$/g, '<div class="my-6 p-4 bg-slate-100 dark:bg-slate-900 rounded-xl text-center font-mono font-semibold text-sm sm:text-base border border-border">$1</div>')
                  }}
                />
              </div>

              {/* Comments Placeholder */}
              <div className="border-t border-border mt-12 pt-8 space-y-4 select-none">
                <h3 className="text-lg font-bold text-foreground">Comments (0)</h3>
                <div className="p-6 rounded-xl border border-border bg-slate-50 dark:bg-slate-900/40 text-center text-slate-500 text-xs">
                  Reader comments are disabled for guest accounts. Please sign in or join a membership plan in the future to comment.
                </div>
              </div>
            </article>

            {/* Sidebar metadata column */}
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
                <Card className="p-5 bg-card">
                  <TableOfContents content={article.content} />
                </Card>
              </div>
            </aside>
          </div>

          {/* Related Articles Section */}
          <div className="border-t border-border/40 pt-12 space-y-6">
            <h3 className="text-xl font-extrabold text-foreground select-none">Related Articles</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl">
              {recommendations.map((rec) => (
                <ArticleCard key={rec.id} article={rec} />
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
  const articlesList = await getAllArticles();
  return articlesList.map((a) => ({
    slug: a.slug,
  }));
}
