import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Clock, Calendar, Globe } from "lucide-react";
import { AnnouncementBar, Navbar, Footer } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { ShareButtons } from "@/components/blog/share-buttons";
import { NewsCard } from "@/components/common/cards";
import { news } from "@/content/news";
import { ArticleSchema, BreadcrumbsSchema } from "@/components/common/seo";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function NewsDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const item = news.find((n) => n.slug === slug);

  if (!item) {
    notFound();
  }

  // Recommendations: 3 related stories excluding active one
  const recommendations = news
    .filter((n) => n.id !== item.id && n.category === item.category)
    .slice(0, 3);

  const finalRecs = recommendations.length > 0
    ? recommendations
    : news.filter(n => n.id !== item.id).slice(0, 3);

  const breadcrumbs = [
    { name: "Home", item: "https://ravi-intelligence.com" },
    { name: "News", item: "https://ravi-intelligence.com/news" },
    { name: item.title, item: `https://ravi-intelligence.com/news/${item.slug}` }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <AnnouncementBar />
      <Navbar />
      <ArticleSchema
        title={item.title}
        description={item.excerpt}
        coverImage={item.coverImage}
        datePublished={item.publishedAt}
        authorName={item.source}
        url={`https://ravi-intelligence.com/news/${item.slug}`}
      />
      <BreadcrumbsSchema items={breadcrumbs} />

      <main className="flex-grow py-10 px-4 sm:px-6 lg:px-8 bg-slate-50/40 dark:bg-transparent">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1 text-xs text-slate-500 select-none">
            <Link href="/" className="hover:underline">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/news" className="hover:underline">News</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-semibold truncate max-w-[200px]">
              {item.title}
            </span>
          </nav>

          {/* Editorial Article Header */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 select-none">
              <Badge variant="primary" className="font-bold uppercase tracking-wider text-[10px] py-0.5 px-2.5">
                {item.category}
              </Badge>
              <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {item.readingTime} min read
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
              {item.title}
            </h1>

            {/* Source & Date metadata */}
            <div className="flex flex-wrap items-center justify-between border-t border-b border-border/40 py-3.5 gap-4">
              <div className="flex items-center gap-4 text-xs text-slate-500 select-none">
                <span className="flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5 text-primary" /> Source: {item.source}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> {item.publishedAt}
                </span>
              </div>
              <ShareButtons title={item.title} />
            </div>
          </div>

          {/* Banner cover */}
          <div className="aspect-video sm:aspect-[21/9] w-full rounded-2xl overflow-hidden border border-border select-none">
            <img
              src={item.coverImage}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Body Content */}
          <div className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-350 space-y-5 text-sm sm:text-base leading-relaxed">
            <div
              dangerouslySetInnerHTML={{
                __html: item.content
                  .replace(/\n\n/g, "<p className='mb-4'></p>")
                  .replace(/### (.*)/g, "<h3 class='text-lg sm:text-xl font-bold text-foreground mt-6 mb-2'>$1</h3>")
                  .replace(/## (.*)/g, "<h2 class='text-xl sm:text-2xl font-extrabold text-foreground mt-8 mb-3 border-b border-border/40 pb-2'>$1</h2>")
                  .replace(/`([^`]+)`/g, "<code class='px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-primary text-xs font-mono border border-border/60'>$1</code>")
                  .replace(/^- (.*)/g, "<li class='ml-4 list-disc'>$1</li>")
              }}
            />
          </div>

          {/* Related Stories list */}
          <div className="border-t border-border/40 pt-12 space-y-6">
            <h3 className="text-xl font-extrabold text-foreground select-none">Related Stories</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {finalRecs.map((rec) => (
                <NewsCard key={rec.id} item={rec} />
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
