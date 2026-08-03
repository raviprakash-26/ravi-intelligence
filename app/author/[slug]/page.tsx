import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, FileText, User } from "lucide-react";
import { AnnouncementBar, Navbar, Footer } from "@/components/layout";
import { getAllArticles } from "@/lib/content";
import { ArticleCard } from "@/components/common/cards";
import { BreadcrumbsSchema } from "@/components/common/seo";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function AuthorProfilePage({ params }: PageProps) {
  const { slug } = await params;
  
  const allArticles = await getAllArticles();
  
  // Find articles matching author slug
  const authorArticles = allArticles.filter((art) => {
    const derivedSlug = art.author.name.toLowerCase().split(" ").join("-");
    return derivedSlug === slug;
  });

  if (authorArticles.length === 0) {
    notFound();
  }

  const authorInfo = authorArticles[0].author;

  const breadcrumbsList = [
    { name: "Home", item: "https://ravi-intelligence.com" },
    { name: "Authors", item: "https://ravi-intelligence.com/author" },
    { name: authorInfo.name, item: `https://ravi-intelligence.com/author/${slug}` }
  ];

  const authorSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": authorInfo.name,
    "jobTitle": authorInfo.role,
    "description": authorInfo.bio,
    "image": authorInfo.avatar
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AnnouncementBar />
      <Navbar />

      {/* SEO schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(authorSchema) }}
      />
      <BreadcrumbsSchema items={breadcrumbsList} />

      <main className="flex-grow py-10 px-4 sm:px-6 lg:px-8 bg-slate-50/30 dark:bg-transparent">
        <div className="max-w-5xl mx-auto space-y-10">
          
          {/* Breadcrumb line */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium select-none">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <span className="text-slate-455">Authors</span>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <span className="text-foreground font-semibold">{authorInfo.name}</span>
          </nav>

          {/* Author profile bio panel */}
          <div className="p-6 rounded-2xl border border-border bg-card flex flex-col sm:flex-row gap-5 items-center sm:items-start select-none">
            <img
              src={authorInfo.avatar}
              alt={authorInfo.name}
              className="h-16 w-16 rounded-full border object-cover shadow-sm bg-slate-100"
            />
            <div className="space-y-2 text-center sm:text-left">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-foreground leading-tight">
                  {authorInfo.name}
                </h1>
                <p className="text-xs font-bold text-primary uppercase tracking-wide">
                  {authorInfo.role}
                </p>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
                {authorInfo.bio}
              </p>
            </div>
          </div>

          {/* Grid list of articles */}
          <div className="space-y-6">
            <div className="border-b border-border/40 pb-3 flex items-center justify-between select-none">
              <h3 className="font-extrabold text-base sm:text-lg text-foreground flex items-center gap-1.5">
                <FileText className="h-4.5 w-4.5 text-primary" />
                <span>Articles by {authorInfo.name}</span>
              </h3>
              <span className="text-[10px] text-slate-450 font-bold uppercase">
                {authorArticles.length} publications
              </span>
            </div>

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
