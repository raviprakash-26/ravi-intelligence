"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, Sparkles, ShoppingBag, FileText, BookOpen, Terminal, X, CornerDownLeft, Sparkle, History, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchItem {
  title: string;
  description: string;
  url: string;
  type: string;
  category: string;
}

const POPULAR_SEARCHES = ["SQL", "Excel", "Power BI", "Python", "Prompts"];

export function SearchPalette() {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [index, setIndex] = React.useState<SearchItem[]>([]);
  const [results, setResults] = React.useState<SearchItem[]>([]);
  const [activeIdx, setActiveIdx] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [recentSearches, setRecentSearches] = React.useState<string[]>([]);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  // 1. Listen to global keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        // "/" is a normal character while typing, so it must not hijack focus
        // out of any field the user is filling in.
        const target = e.target as HTMLElement | null;
        const isEditing =
          !!target &&
          (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
            target.isContentEditable);
        if (e.key === "/" && isEditing) return;
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 2. Load recent searches & index
  React.useEffect(() => {
    if (!isOpen) return;

    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ravi-intelligence-recent-searches");
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    }

    const fetchSearchIndex = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/search");
        if (res.ok) {
          const data = await res.json();
          setIndex(data);
        }
      } catch (err) {
        console.error("Search index fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchIndex();
    setSearchQuery("");
    setActiveIdx(0);
    setTimeout(() => inputRef.current?.focus(), 80);
  }, [isOpen]);

  // 3. Simple fuzzy query compiler
  React.useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const matches = index.filter((item) => {
      return (
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query)
      );
    });

    setResults(matches.slice(0, 7));
    setActiveIdx(0);
  }, [searchQuery, index]);

  const addRecentSearch = (query: string) => {
    if (!query.trim()) return;
    const updated = [query, ...recentSearches.filter((s) => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("ravi-intelligence-recent-searches", JSON.stringify(updated));
  };

  const handleNavigate = (url: string) => {
    if (searchQuery.trim()) {
      addRecentSearch(searchQuery.trim());
    }
    setIsOpen(false);
    router.push(url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((prev) => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[activeIdx]) {
        handleNavigate(results[activeIdx].url);
      }
    }
  };

  // Scroll active item into view
  React.useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.children[activeIdx] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [activeIdx]);

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "article":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "resource":
        return <ShoppingBag className="h-4 w-4 text-emerald-500" />;
      case "learning path":
        return <BookOpen className="h-4 w-4 text-purple-500" />;
      case "ai prompt":
        return <Sparkles className="h-4 w-4 text-amber-500" />;
      default:
        return <Terminal className="h-4 w-4 text-slate-400" />;
    }
  };

  // Without this the full-screen overlay below renders on every page, covering
  // the site and swallowing every click.
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Global Search Palette"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[12vh] p-4 select-none"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="w-full max-w-xl bg-card border border-border rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search header input */}
        <div className="relative border-b border-border/60 p-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search site content (press Esc to exit)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 bg-transparent text-sm text-foreground focus:outline-none placeholder:text-slate-400"
          />
          <button
            onClick={() => setIsOpen(false)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-foreground cursor-pointer transition-colors"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Results layout */}
        <div className="max-h-[350px] overflow-y-auto p-2 scrollbar-thin">
          {loading ? (
            <div className="text-center py-10 text-xs text-slate-400 animate-pulse font-medium">
              Scanning directories search index...
            </div>
          ) : searchQuery.trim() === "" ? (
            <div className="py-6 px-4 space-y-6">
              
              {/* Recent searches history */}
              {recentSearches.length > 0 && (
                <div className="space-y-2 text-left">
                  <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 leading-none select-none">
                    <History className="h-3.5 w-3.5" /> Recent Searches
                  </h5>
                  <div className="flex flex-wrap gap-2 pt-1.5">
                    {recentSearches.map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setSearchQuery(s);
                          inputRef.current?.focus();
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold border border-border bg-card rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer text-slate-655 dark:text-slate-350 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular searches tags */}
              <div className="space-y-2 text-left">
                <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 leading-none select-none">
                  <Flame className="h-3.5 w-3.5 text-amber-550 animate-pulse" /> Trending Subjects
                </h5>
                <div className="flex flex-wrap gap-2 pt-1.5">
                  {POPULAR_SEARCHES.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setSearchQuery(s);
                        inputRef.current?.focus();
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold border border-border bg-card rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer text-slate-655 dark:text-slate-350 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          ) : results.length === 0 ? (
            <div className="py-8 px-4 text-center space-y-1.5">
              <Sparkle className="h-6 w-6 text-slate-450 mx-auto" />
              <p className="text-xs font-bold text-foreground">No matches found</p>
              <p className="text-[10px] text-slate-550">Try searching for subjects like &quot;SQL&quot; or &quot;Excel&quot;.</p>
            </div>
          ) : (
            <div ref={listRef} className="space-y-1">
              {results.map((item, idx) => {
                const isActive = idx === activeIdx;
                return (
                  <div
                    key={idx}
                    onClick={() => handleNavigate(item.url)}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-xl cursor-pointer border transition-all duration-150 select-text",
                      isActive
                        ? "bg-slate-100/80 dark:bg-slate-800 border-border/80"
                        : "bg-transparent border-transparent"
                    )}
                  >
                    <div className="mt-0.5 shrink-0 select-none">{getTypeIcon(item.type)}</div>
                    <div className="flex-grow space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-extrabold text-xs sm:text-sm text-foreground leading-snug">
                          {item.title}
                        </h4>
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wide select-none shrink-0 font-mono">
                          {item.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-555 dark:text-slate-400 line-clamp-1 leading-normal">
                        {item.description}
                      </p>
                    </div>
                    {isActive && (
                      <div className="self-center text-[10px] font-bold text-slate-400 flex items-center gap-0.5 select-none shrink-0 pr-1">
                        <span className="text-[8px] border border-slate-350 dark:border-slate-700 px-1 py-0.2 rounded font-mono">Enter</span>
                        <CornerDownLeft className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="bg-slate-50 dark:bg-slate-900/40 px-4 py-2.5 border-t border-border/50 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider select-none">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>•</span>
            <span>Enter Select</span>
          </div>
          <span>Esc Close</span>
        </div>
      </div>
    </div>
  );
}
