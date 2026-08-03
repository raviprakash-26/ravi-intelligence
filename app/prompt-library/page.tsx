"use client";

import * as React from "react";
import { Sparkles, Search } from "lucide-react";
import { AnnouncementBar, Navbar, Footer } from "@/components/layout";
import { PromptCard } from "@/components/common/cards";
import { prompts } from "@/content/prompts";

export default function PromptLibraryPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("All");

  const categories = [
    "All",
    "Business",
    "AI",
    "Marketing",
    "YouTube",
    "Instagram",
    "LinkedIn",
    "Logo Design",
    "Website Design",
    "3D Illustration",
    "UI Design",
    "Icons",
    "Product Mockups",
    "Portrait Photography",
    "Food Photography",
    "Architecture",
    "Fantasy Art",
    "Anime",
    "Realistic Images"
  ];

  const filteredPrompts = React.useMemo(() => {
    return prompts.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="flex flex-col min-h-screen">
      <AnnouncementBar />
      <Navbar />

      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/50 dark:bg-transparent">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4 select-none">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 animate-pulse text-amber-500" />
              <span>Gemini Prompt Library</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Copypasta Gemini Generative AI Prompts
            </h1>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
              Accelerate your engineering and marketing creative output. Discover prompts, preview mock outputs, and copy setups with one click.
            </p>
          </div>

          {/* Filters and Search Bar */}
          <div className="space-y-6 max-w-5xl mx-auto select-none">
            {/* Search Box */}
            <div className="relative w-full max-w-md mx-auto">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search prompts, categories, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              />
            </div>

            {/* Horizontal Scrollable Category chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-3 border-b border-border/40 scroll-smooth">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer shrink-0 ${
                    selectedCategory === cat
                      ? "bg-primary text-white border-primary"
                      : "bg-card text-slate-650 dark:text-slate-400 border-border hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid display */}
          {filteredPrompts.length === 0 ? (
            <div className="text-center py-20 max-w-md mx-auto space-y-3 select-none">
              <Sparkles className="h-10 w-10 text-slate-450 mx-auto stroke-[1.5]" />
              <h3 className="font-bold text-lg text-foreground">No Prompts Found</h3>
              <p className="text-xs text-slate-500">Try modifying your category filters or search queries.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {filteredPrompts.map((item) => (
                <PromptCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
