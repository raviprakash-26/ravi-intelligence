"use client";

import * as React from "react";
import Link from "next/link";
import { FileText, Search, Clock, ArrowRight, Sparkles } from "lucide-react";
import { AnnouncementBar, Navbar, Footer } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArticleCard } from "@/components/common/cards";
import { MdxArticle } from "@/types";

interface BlogClientProps {
  articles: MdxArticle[];
}

export function BlogClient({ articles }: BlogClientProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("All");

  const categories = React.useMemo(() => {
    return ["All", ...Array.from(new Set(articles.map((a) => a.category)))];
  }, [articles]);

  const featuredArticle = React.useMemo(() => {
    return articles.find((a) => a.featured) || articles[0];
  }, [articles]);

  const filteredArticles = React.useMemo(() => {
    return articles.filter((a) => {
      // Exclude featured article from the general grid to avoid repetition
      if (featuredArticle && a.id === featuredArticle.id && searchQuery === "" && selectedCategory === "All") return false;

      const matchesSearch =
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = selectedCategory === "All" || a.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [articles, searchQuery, selectedCategory, featuredArticle]);

  const editorsPicks = React.useMemo(() => {
    return articles.filter((a) => a.editorPick);
  }, [articles]);

  return (
    <div className="flex flex-col min-h-screen">
      <AnnouncementBar />
      <Navbar />

      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/50 dark:bg-transparent">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4 select-none">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
              <FileText className="h-3.5 w-3.5" />
              <span>Premium Knowledge Hub</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Ravi Intelligence Editorial
            </h1>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
              Read in-depth guides, code analysis walkthroughs, and conceptual articles covering data ecosystems, corporate finance models, and artificial intelligence.
            </p>
          </div>

          {/* ==================== FEATURED STORY (Only shown when not searching/filtering) ==================== */}
          {searchQuery === "" && selectedCategory === "All" && featuredArticle && (
            <section className="max-w-5xl mx-auto">
              <Card hoverEffect className="group bg-card grid grid-cols-1 md:grid-cols-12 overflow-hidden border border-border">
                <Link href={`/blog/${featuredArticle.slug}`} className="md:col-span-7 block relative overflow-hidden aspect-video md:aspect-auto h-full min-h-[300px]">
                  <img
                    src={featuredArticle.coverImage}
                    alt={featuredArticle.title}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge variant="accent" className="font-bold py-1 px-3">Featured Story</Badge>
                  </div>
                </Link>

                <CardContent className="md:col-span-5 p-6 sm:p-8 flex flex-col justify-between h-full space-y-6">
                  <div className="space-y-3.5">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{featuredArticle.publishedAt}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {featuredArticle.readingTime} min read
                      </span>
                    </div>
                    <Link href={`/blog/${featuredArticle.slug}`} className="block">
                      <h2 className="text-xl sm:text-2xl font-black text-foreground hover:text-primary transition-colors leading-tight">
                        {featuredArticle.title}
                      </h2>
                    </Link>
                    <p className="text-sm text-slate-500 dark:text-slate-450 leading-relaxed line-clamp-4">
                      {featuredArticle.excerpt}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-border/40 pt-4 mt-auto">
                    <div className="flex items-center gap-2">
                      <img
                        src={featuredArticle.author.avatar}
                        alt={featuredArticle.author.name}
                        className="h-8 w-8 rounded-full border"
                      />
                      <div>
                        <p className="text-xs font-bold leading-none text-foreground">{featuredArticle.author.name}</p>
                        <p className="text-[10px] text-slate-500 mt-1 leading-none">{featuredArticle.author.role}</p>
                      </div>
                    </div>

                    <Link href={`/blog/${featuredArticle.slug}`} className="text-primary hover:text-blue-700 font-bold text-xs inline-flex items-center gap-0.5 group/btn">
                      Read Article
                      <ArrowRight className="h-3 w-3 group-hover/btn:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {/* ==================== FILTERS AND MAIN FEED ==================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-5xl mx-auto">
            {/* Left Feed */}
            <div className="lg:col-span-8 space-y-8">
              {/* Controls bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border/40 pb-5 select-none">
                <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors cursor-pointer shrink-0 ${
                        selectedCategory === cat
                          ? "bg-primary text-white border-primary"
                          : "bg-card text-slate-600 dark:text-slate-400 border-border hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-10 pl-10 pr-4 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                  />
                </div>
              </div>

              {/* Grid List */}
              {filteredArticles.length === 0 ? (
                <div className="text-center py-20 space-y-3 select-none">
                  <Sparkles className="h-10 w-10 text-slate-455 mx-auto stroke-[1.5]" />
                  <h3 className="font-bold text-lg text-foreground">No Articles Found</h3>
                  <p className="text-xs text-slate-500">Try revising your keyword filters.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {filteredArticles.map((art) => (
                    <ArticleCard key={art.id} article={art} />
                  ))}
                </div>
              )}
            </div>

            {/* Right Editor picks */}
            <aside className="lg:col-span-4 space-y-6 select-none">
              <Card className="p-5 space-y-4 bg-card">
                <h3 className="font-bold text-sm text-foreground border-b border-border/40 pb-2">
                  Editor&apos;s Picks
                </h3>
                <div className="divide-y divide-border/40">
                  {editorsPicks.map((pick) => (
                    <div key={pick.id} className="py-3.5 first:pt-0 last:pb-0 group">
                      <div className="text-[10px] text-primary font-bold uppercase tracking-wider mb-1">
                        {pick.category}
                      </div>
                      <Link href={`/blog/${pick.slug}`}>
                        <h4 className="text-xs font-bold leading-snug group-hover:text-primary transition-colors text-foreground line-clamp-2">
                          {pick.title}
                        </h4>
                      </Link>
                      <p className="text-[10px] text-slate-500 mt-1">{pick.publishedAt}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
