"use client";

import * as React from "react";
import { Search, Sparkles } from "lucide-react";
import { PromptCard } from "./prompt-components";
import { AnnouncementBar, Navbar, Footer } from "@/components/layout";
import { PromptItem } from "@/types";

interface PromptsClientProps {
  initialPrompts: PromptItem[];
}

export function PromptsClient({ initialPrompts }: PromptsClientProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedPlatform, setSelectedPlatform] = React.useState("All");
  const [selectedCategory, setSelectedCategory] = React.useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = React.useState("All");
  const [currentPage, setCurrentPage] = React.useState(1);

  const ITEMS_PER_PAGE = 8;

  // Extract platforms & categories dynamically
  const platformsList = React.useMemo(() => {
    return ["All", ...Array.from(new Set(initialPrompts.map((p) => p.platform)))].sort();
  }, [initialPrompts]);

  const categoriesList = React.useMemo(() => {
    return ["All", ...Array.from(new Set(initialPrompts.map((p) => p.category)))].sort();
  }, [initialPrompts]);

  // Filters logic
  const filteredPrompts = React.useMemo(() => {
    return initialPrompts.filter((prompt) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        prompt.title.toLowerCase().includes(q) ||
        prompt.description.toLowerCase().includes(q) ||
        prompt.prompt.toLowerCase().includes(q) ||
        prompt.tags.some((t) => t.toLowerCase().includes(q));

      const matchesPlatform = selectedPlatform === "All" || prompt.platform === selectedPlatform;
      const matchesCategory = selectedCategory === "All" || prompt.category === selectedCategory;
      const matchesDifficulty = selectedDifficulty === "All" || prompt.difficulty.toLowerCase() === selectedDifficulty.toLowerCase();

      return matchesSearch && matchesPlatform && matchesCategory && matchesDifficulty;
    });
  }, [initialPrompts, searchQuery, selectedPlatform, selectedCategory, selectedDifficulty]);

  // Reset pagination on filter adjustment
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedPlatform, selectedCategory, selectedDifficulty]);

  // Calculate paginated index list
  const totalPages = Math.ceil(filteredPrompts.length / ITEMS_PER_PAGE);
  const paginatedPrompts = React.useMemo(() => {
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPrompts.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  }, [filteredPrompts, currentPage]);

  return (
    <div className="flex flex-col min-h-screen">
      <AnnouncementBar />
      <Navbar />

      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/30 dark:bg-transparent">
        <div className="max-w-7xl mx-auto space-y-10">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4 select-none py-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 animate-pulse text-amber-500" />
              <span>Prompt Hub</span>
            </div>
            <h1 className="text-3xl sm:text-4.5xl font-black tracking-tight text-foreground leading-tight">
              Curated AI Prompt Engineering Library
            </h1>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
              Unlock the full potential of ChatGPT, Claude, Gemini, and Midjourney. Customize variables, compile, and copy prompts with one click.
            </p>
          </div>

          {/* Filtering Control Bar */}
          <div className="space-y-4 max-w-5xl mx-auto border-b border-border/40 pb-6 select-none">
            {/* Search Input */}
            <div className="relative w-full max-w-lg mx-auto">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search AI prompts, keywords, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10.5 pl-10 pr-4 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              />
            </div>

            {/* Filter Dropdowns Grid */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {/* Platform Filter */}
              <div className="flex items-center gap-1.5 bg-card border border-border px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-650 dark:text-slate-350">
                <span className="text-slate-400">Platform:</span>
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="bg-transparent font-extrabold focus:outline-none cursor-pointer text-foreground"
                >
                  {platformsList.map((p) => (
                    <option key={p} value={p}>{p === "All" ? "All Platforms" : p}</option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1.5 bg-card border border-border px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-650 dark:text-slate-350">
                <span className="text-slate-400">Subject:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-transparent font-extrabold focus:outline-none cursor-pointer text-foreground"
                >
                  {categoriesList.map((c) => (
                    <option key={c} value={c}>{c === "All" ? "All Categories" : c}</option>
                  ))}
                </select>
              </div>

              {/* Difficulty Filter */}
              <div className="flex items-center gap-1.5 bg-card border border-border px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-650 dark:text-slate-350">
                <span className="text-slate-400">Complexity:</span>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="bg-transparent font-extrabold focus:outline-none cursor-pointer text-foreground"
                >
                  <option value="All">All Levels</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>
          </div>

          {/* Prompts Catalog Grid */}
          {paginatedPrompts.length === 0 ? (
            <div className="text-center py-20 max-w-md mx-auto space-y-3 select-none">
              <Sparkles className="h-10 w-10 text-slate-450 mx-auto stroke-[1.5]" />
              <h3 className="font-bold text-lg text-foreground animate-pulse">No Prompts Found</h3>
              <p className="text-xs text-slate-500">Try adjusting search parameters or tag keywords.</p>
            </div>
          ) : (
            <div className="space-y-10 max-w-5xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {paginatedPrompts.map((p) => (
                  <PromptCard key={p.id} prompt={p} />
                ))}
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-6 select-none border-t border-border/40">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="h-8.5 px-3 rounded-lg border border-border bg-card text-xs font-bold text-slate-650 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-xs font-bold text-slate-500 px-3">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="h-8.5 px-3 rounded-lg border border-border bg-card text-xs font-bold text-slate-650 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
