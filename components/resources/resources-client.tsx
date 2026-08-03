"use client";

import * as React from "react";
import { Sparkles, SlidersHorizontal } from "lucide-react";
import { ResourceHero, ResourceFilters, ResourceCard } from "./resource-components";
import { AnnouncementBar, Navbar, Footer } from "@/components/layout";
import { ResourceItem } from "@/types";

interface ResourcesClientProps {
  initialResources: ResourceItem[];
}

export function ResourcesClient({ initialResources }: ResourcesClientProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [category, setCategory] = React.useState("All");
  const [difficulty, setDifficulty] = React.useState("All");
  const [priceType, setPriceType] = React.useState("All");
  const [sortBy, setSortBy] = React.useState("Newest");
  const [currentPage, setCurrentPage] = React.useState(1);

  const ITEMS_PER_PAGE = 8;

  // Extract unique categories dynamically
  const categoriesList = React.useMemo(() => {
    return Array.from(new Set(initialResources.map((r) => r.category))).sort();
  }, [initialResources]);

  // Filtering logic
  const filteredAndSortedResources = React.useMemo(() => {
    let result = [...initialResources];

    // 1. Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    // 2. Filter by category
    if (category !== "All") {
      result = result.filter((r) => r.category === category);
    }

    // 3. Filter by difficulty
    if (difficulty !== "All") {
      result = result.filter((r) => r.difficulty.toLowerCase() === difficulty.toLowerCase());
    }

    // 4. Filter by free / premium license
    if (priceType !== "All") {
      const wantFree = priceType === "Free";
      result = result.filter((r) => r.free === wantFree);
    }

    // 5. Sort by criteria
    if (sortBy === "Newest") {
      result.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    } else if (sortBy === "Popular") {
      result.sort((a, b) => b.downloadsCount - a.downloadsCount);
    }

    return result;
  }, [initialResources, searchQuery, category, difficulty, priceType, sortBy]);

  // Reset pagination on filter adjustments
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, category, difficulty, priceType, sortBy]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredAndSortedResources.length / ITEMS_PER_PAGE);
  const paginatedResources = React.useMemo(() => {
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedResources.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  }, [filteredAndSortedResources, currentPage]);

  return (
    <div className="flex flex-col min-h-screen">
      <AnnouncementBar />
      <Navbar />

      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/30 dark:bg-transparent">
        <div className="max-w-7xl mx-auto space-y-10">
          
          {/* Marketplace header */}
          <ResourceHero />

          {/* Filtering control sheets */}
          <ResourceFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            category={category}
            setCategory={setCategory}
            difficulty={difficulty}
            setDifficulty={setDifficulty}
            priceType={priceType}
            setPriceType={setPriceType}
            sortBy={sortBy}
            setSortBy={setSortBy}
            categories={categoriesList}
          />

          {/* Catalog grid rendering */}
          {paginatedResources.length === 0 ? (
            <div className="text-center py-20 max-w-md mx-auto space-y-3 select-none">
              <Sparkles className="h-10 w-10 text-slate-450 mx-auto stroke-[1.5]" />
              <h3 className="font-bold text-lg text-foreground animate-pulse">No Assets Found</h3>
              <p className="text-xs text-slate-500">Try modifying your filters or search keywords.</p>
            </div>
          ) : (
            <div className="space-y-10 max-w-5xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {paginatedResources.map((res) => (
                  <ResourceCard key={res.id} resource={res} />
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
