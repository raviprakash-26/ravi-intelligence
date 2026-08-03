"use client";

import * as React from "react";
import { Download, Search, Sparkles } from "lucide-react";
import { AnnouncementBar, Navbar, Footer } from "@/components/layout";
import { ResourceCard } from "@/components/common/cards";
import { resources } from "@/content/resources";

export default function FreeResourcesPage() {
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredResources = React.useMemo(() => {
    return resources.filter((res) => {
      return (
        res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.fileType.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [searchQuery]);

  const handleDownload = (title: string, slug: string) => {
    // Simulate digital asset download
    const link = document.createElement("a");
    link.href = "#";
    link.setAttribute("download", `${slug}-ravi-intelligence.zip`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert(`Thank you for downloading: ${title}! Check your downloads folder.`);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AnnouncementBar />
      <Navbar />

      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8 bg-slate-50/50 dark:bg-transparent">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4 select-none">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
              <Download className="h-3.5 w-3.5" />
              <span>Free Resource Library</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Download Free Analytics & Business Templates
            </h1>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
              Accelerate your analytical tasks and prepare for career opportunities with free, curated datasets, cheat sheets, resume structures, and budget sheets.
            </p>
          </div>

          {/* Search bar */}
          <div className="flex justify-center select-none border-b border-border/40 pb-5 max-w-5xl mx-auto">
            <div className="relative w-full sm:max-w-md shrink-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search templates, datasets, files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              />
            </div>
          </div>

          {/* Resources Catalog Grid */}
          {filteredResources.length === 0 ? (
            <div className="text-center py-20 max-w-md mx-auto space-y-3 select-none">
              <Sparkles className="h-10 w-10 text-slate-450 mx-auto stroke-[1.5]" />
              <h3 className="font-bold text-lg text-foreground">No Resources Found</h3>
              <p className="text-xs text-slate-500">Try modifying your keyword search query.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {filteredResources.map((res) => (
                <ResourceCard
                  key={res.id}
                  resource={res}
                  onDownload={() => handleDownload(res.title, res.slug)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
