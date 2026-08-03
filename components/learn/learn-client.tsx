"use client";

import * as React from "react";
import { Search, Sparkles, SlidersHorizontal, ArrowRight, Award } from "lucide-react";
import { LearningCard, LearningHero } from "./learn-components";
import { AnnouncementBar, Navbar, Footer } from "@/components/layout";
import { LearningPath } from "@/types";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface LearnClientProps {
  initialPaths: LearningPath[];
}

export function LearnClient({ initialPaths }: LearnClientProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = React.useState("All");

  // Compile categories dynamically
  const categoriesList = React.useMemo(() => {
    return ["All", ...Array.from(new Set(initialPaths.map((p) => p.category)))].sort();
  }, [initialPaths]);

  // Filtering logic
  const filteredPaths = React.useMemo(() => {
    return initialPaths.filter((path) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        path.title.toLowerCase().includes(q) ||
        path.description.toLowerCase().includes(q) ||
        path.category.toLowerCase().includes(q);

      const matchesCategory = selectedCategory === "All" || path.category === selectedCategory;
      const matchesDifficulty = selectedDifficulty === "All" || path.difficulty.toLowerCase() === selectedDifficulty.toLowerCase();

      return matchesSearch && matchesCategory && matchesDifficulty;
    });
  }, [initialPaths, searchQuery, selectedCategory, selectedDifficulty]);

  return (
    <div className="flex flex-col min-h-screen">
      <AnnouncementBar />
      <Navbar />

      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/30 dark:bg-transparent">
        <div className="max-w-7xl mx-auto space-y-12">
          
          {/* Index Hero */}
          <LearningHero />

          {/* Search and Filters panel */}
          <div className="space-y-4 max-w-5xl mx-auto border-b border-border/40 pb-6 select-none">
            {/* Search Input */}
            <div className="relative w-full max-w-lg mx-auto">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search SQL, Excel, Python learning paths..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10.5 pl-10 pr-4 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              />
            </div>

            {/* Filtering Controls */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {/* Category tabs */}
              <div className="flex items-center gap-1.5 bg-card border border-border px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-650 dark:text-slate-350">
                <span className="text-slate-400">Subject:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-transparent font-extrabold focus:outline-none cursor-pointer text-foreground"
                >
                  {categoriesList.map((c) => (
                    <option key={c} value={c}>{c === "All" ? "All Subjects" : c}</option>
                  ))}
                </select>
              </div>

              {/* Difficulty Selection */}
              <div className="flex items-center gap-1.5 bg-card border border-border px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-650 dark:text-slate-350">
                <span className="text-slate-400">Difficulty:</span>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="bg-transparent font-extrabold focus:outline-none cursor-pointer text-foreground"
                >
                  <option value="All">All Tiers</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>
          </div>

          {/* Grid path list */}
          {filteredPaths.length === 0 ? (
            <div className="text-center py-20 max-w-md mx-auto space-y-3 select-none">
              <Sparkles className="h-10 w-10 text-slate-450 mx-auto stroke-[1.5]" />
              <h3 className="font-bold text-lg text-foreground animate-pulse">No Learning Paths Found</h3>
              <p className="text-xs text-slate-500">Try modifying your query or level filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {filteredPaths.map((path) => (
                <LearningCard key={path.id} path={path} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
