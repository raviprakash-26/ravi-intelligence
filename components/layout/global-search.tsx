"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, Newspaper, BookOpen, ShoppingBag, Download, Sparkles, Command } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { news } from "@/content/news";
import { products } from "@/content/products";
import { resources } from "@/content/resources";
import { prompts } from "@/content/prompts";

interface SearchResult {
  id: string;
  type: "article" | "news" | "path" | "product" | "resource" | "prompt";
  title: string;
  description: string;
  url: string;
  category: string;
}

export function GlobalSearch() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<"all" | "article" | "news" | "path" | "product" | "resource" | "prompt">("all");
  const router = useRouter();
  const [articlesList, setArticlesList] = React.useState<any[]>([]);

  React.useEffect(() => {
    fetch("/api/articles")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setArticlesList(data);
        }
      })
      .catch((err) => console.error("Error loading articles search index:", err));
  }, []);

  // Keyboard shortcut Ctrl+K / Cmd+K
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Compile search database
  const searchDatabase = React.useMemo<SearchResult[]>(() => {
    const items: SearchResult[] = [];

    // Articles
    articlesList.forEach((a) => {
      items.push({
        id: a.id,
        type: "article",
        title: a.title,
        description: a.excerpt,
        url: `/blog/${a.slug}`,
        category: a.category,
      });
    });

    // News
    news.forEach((n) => {
      items.push({
        id: n.id,
        type: "news",
        title: n.title,
        description: n.excerpt,
        url: `/news/${n.slug}`,
        category: n.category,
      });
    });

    // Products
    products.forEach((p) => {
      items.push({
        id: p.id,
        type: "product",
        title: p.title,
        description: p.description,
        url: `/store/${p.slug}`,
        category: p.type,
      });
    });

    // Resources
    resources.forEach((r) => {
      items.push({
        id: r.id,
        type: "resource",
        title: r.title,
        description: r.description,
        url: `/resources`,
        category: r.fileType,
      });
    });

    // Prompts
    prompts.forEach((p) => {
      items.push({
        id: p.id,
        type: "prompt",
        title: p.title,
        description: p.tags.join(", "),
        url: `/prompt-library/${p.slug}`,
        category: p.category,
      });
    });

    return items;
  }, [articlesList]);

  // Filter and Query Logic
  const filteredResults = React.useMemo(() => {
    if (!query.trim()) return [];

    return searchDatabase.filter((item) => {
      const matchesFilter = filter === "all" || item.type === filter;
      const matchesQuery =
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [query, filter, searchDatabase]);

  const handleSelect = (url: string) => {
    setIsOpen(false);
    setQuery("");
    router.push(url);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "article":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "news":
        return <Newspaper className="h-4 w-4 text-amber-500" />;
      case "product":
        return <ShoppingBag className="h-4 w-4 text-pink-500" />;
      case "resource":
        return <Download className="h-4 w-4 text-purple-500" />;
      case "prompt":
        return <Sparkles className="h-4 w-4 text-orange-500" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  return (
    <>
      {/* Trigger Button inside Navbar */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-between gap-3 px-3 py-1.5 rounded-lg border border-border bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-sm text-slate-500 transition-colors w-full max-w-[200px] text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <span className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          <span>Search...</span>
        </span>
        <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-border bg-card px-1.5 font-mono text-[10px] font-medium text-slate-400">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Global Search Dialog */}
      <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} title="Search Ravi Intelligence">
        <div className="space-y-4">
          {/* Input field */}
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search articles, news, digital products, prompts..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-12 pl-11 pr-4 bg-slate-50 dark:bg-slate-900/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-slate-400"
              autoFocus
            />
          </div>

          {/* Filter chips */}
          <div className="flex flex-wrap gap-1.5 border-b border-border/40 pb-3">
            {[
              { label: "All", value: "all" },
              { label: "Articles", value: "article" },
              { label: "News", value: "news" },
              { label: "Store", value: "product" },
              { label: "Resources", value: "resource" },
              { label: "Gemini Prompts", value: "prompt" },
            ].map((chip) => (
              <button
                key={chip.value}
                onClick={() => setFilter(chip.value as any)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                  filter === chip.value
                    ? "bg-primary text-white border-primary"
                    : "bg-transparent text-slate-600 dark:text-slate-400 border-border hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Results list */}
          <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1">
            {query.trim() === "" ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400 space-y-2">
                <Command className="h-8 w-8 stroke-[1.5]" />
                <p className="text-sm font-medium">Type a search query to explore</p>
                <p className="text-xs">Pro-Tip: Filter results using categories above.</p>
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-sm">
                No results found for &ldquo;<span className="text-foreground font-semibold">{query}</span>&rdquo;
              </div>
            ) : (
              filteredResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleSelect(result.url)}
                  className="flex items-start gap-3 p-3 w-full text-left rounded-xl border border-transparent hover:border-border hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all cursor-pointer group"
                >
                  <div className="mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg group-hover:bg-white dark:group-hover:bg-slate-900 border border-transparent group-hover:border-border transition-colors">
                    {getIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                        {result.title}
                      </span>
                      <Badge variant="glass" className="text-[10px] uppercase font-bold py-0">
                        {result.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                      {result.description}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </Dialog>
    </>
  );
}
