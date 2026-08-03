"use client";

import * as React from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, Download, ShoppingBag, Eye, Star, Info, FileText, ChevronRight, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ResourceItem } from "@/types";
import { cn } from "@/lib/utils";

// ========================================================
// 1. RESOURCE HERO
// ========================================================
export function ResourceHero() {
  return (
    <div className="text-center max-w-3xl mx-auto space-y-4 select-none py-4">
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
        <ShoppingBag className="h-3.5 w-3.5" />
        <span>Asset Marketplace</span>
      </div>
      <h1 className="text-3xl sm:text-4.5xl font-black tracking-tight text-foreground leading-tight">
        Premium Analytics Resources & Templates
      </h1>
      <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
        Acquire production-ready spreadsheets, SQL schemas, datasets, resume books, and Power BI canvases to accelerate your operations.
      </p>
    </div>
  );
}

// ========================================================
// 2. RESOURCE CARD
// ========================================================
export function ResourceCard({ resource }: { resource: ResourceItem }) {
  return (
    <Link href={`/resources/${resource.slug}`} className="group block h-full">
      <Card hoverEffect className="overflow-hidden bg-card border border-border h-full flex flex-col justify-between">
        {/* Cover image & badges */}
        <div className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-slate-900 select-none">
          <img
            src={resource.coverImage}
            alt={resource.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-350"
          />
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            <Badge variant="primary" className="text-[9px] font-bold py-0.5 px-2 uppercase tracking-wider">
              {resource.category}
            </Badge>
          </div>
          <div className="absolute bottom-3 right-3 select-none">
            <span className={cn(
              "px-2.5 py-0.5 rounded-md text-[10px] font-bold border shadow-sm backdrop-blur-sm",
              resource.free
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-450"
                : "bg-primary/10 border-primary/20 text-primary"
            )}>
              {resource.free ? "FREE" : `$${resource.price.toFixed(2)}`}
            </span>
          </div>
        </div>

        {/* Content body */}
        <CardContent className="p-4 sm:p-5 flex-grow flex flex-col justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider select-none">
              <span>{resource.fileType}</span>
              <span>•</span>
              <span>{resource.difficulty}</span>
            </div>
            <h3 className="font-extrabold text-sm sm:text-[15px] leading-snug group-hover:text-primary transition-colors text-foreground line-clamp-2">
              {resource.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-450 line-clamp-2 leading-relaxed">
              {resource.description}
            </p>
          </div>

          {/* Bottom stats */}
          <div className="flex items-center justify-between text-[10px] text-slate-450 dark:text-slate-550 border-t border-border/40 pt-3 mt-auto select-none font-medium">
            <span>v{resource.version}</span>
            <span className="flex items-center gap-1">
              <Download className="h-3 w-3" /> {resource.downloadsCount} downloads
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ========================================================
// 3. FILTER & SEARCH COMPONENT
// ========================================================
interface ResourceFiltersProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  category: string;
  setCategory: (c: string) => void;
  difficulty: string;
  setDifficulty: (d: string) => void;
  priceType: string;
  setPriceType: (p: string) => void;
  sortBy: string;
  setSortBy: (s: string) => void;
  categories: string[];
}

export function ResourceFilters({
  searchQuery,
  setSearchQuery,
  category,
  setCategory,
  difficulty,
  setDifficulty,
  priceType,
  setPriceType,
  sortBy,
  setSortBy,
  categories
}: ResourceFiltersProps) {
  return (
    <div className="space-y-4 select-none max-w-5xl mx-auto border-b border-border/40 pb-6">
      {/* Search Input */}
      <div className="relative w-full max-w-lg mx-auto">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
        <input
          type="text"
          placeholder="Search spreadsheets, SQL schemas, datasets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-10.5 pl-10 pr-4 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-slate-400"
        />
      </div>

      {/* Select Controls Grid */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        {/* Category selector */}
        <div className="flex items-center gap-1.5 bg-card border border-border px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-650 dark:text-slate-350">
          <span className="text-slate-400">Category:</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-transparent font-extrabold focus:outline-none cursor-pointer text-foreground"
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Difficulty Selector */}
        <div className="flex items-center gap-1.5 bg-card border border-border px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-650 dark:text-slate-350">
          <span className="text-slate-400">Level:</span>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="bg-transparent font-extrabold focus:outline-none cursor-pointer text-foreground"
          >
            <option value="All">All Levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>

        {/* Price Selector */}
        <div className="flex items-center gap-1.5 bg-card border border-border px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-650 dark:text-slate-350">
          <span className="text-slate-400">License:</span>
          <select
            value={priceType}
            onChange={(e) => setPriceType(e.target.value)}
            className="bg-transparent font-extrabold focus:outline-none cursor-pointer text-foreground"
          >
            <option value="All">All Licenses</option>
            <option value="Free">Free</option>
            <option value="Premium">Premium</option>
          </select>
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-1.5 bg-card border border-border px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-650 dark:text-slate-350">
          <span className="text-slate-400">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-transparent font-extrabold focus:outline-none cursor-pointer text-foreground"
          >
            <option value="Newest">Newest Release</option>
            <option value="Popular">Downloads Count</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// ========================================================
// 4. RESOURCE GALLERY (Screenshots slideshow)
// ========================================================
export function ResourceGallery({ images, title }: { images: string[]; title: string }) {
  const [activeIdx, setActiveIdx] = React.useState(0);

  if (!images || images.length === 0) return null;

  return (
    <div className="space-y-3 select-none">
      <div className="aspect-video w-full rounded-2xl border border-border overflow-hidden bg-slate-100 dark:bg-slate-900 shadow-sm relative">
        <img
          src={images[activeIdx]}
          alt={`${title} screenshot preview`}
          className="w-full h-full object-cover"
        />
      </div>

      {images.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto py-1">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIdx(idx)}
              className={cn(
                "h-14 aspect-video rounded-lg overflow-hidden border cursor-pointer transition-all shrink-0 hover:opacity-90",
                activeIdx === idx ? "border-primary ring-2 ring-primary/20 scale-98" : "border-border opacity-70"
              )}
            >
              <img src={img} alt="Thumbnail preview" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ========================================================
// 5. DOWNLOAD CARD (Simulated Stripe/Gumroad Buy flows)
// ========================================================
export function DownloadCard({ resource }: { resource: ResourceItem }) {
  const [isPurchasing, setIsPurchasing] = React.useState(false);
  const [purchaseComplete, setPurchaseComplete] = React.useState(false);
  const [checkoutEmail, setCheckoutEmail] = React.useState("");

  const handleDownload = () => {
    // Simulate downloading files
    const link = document.createElement("a");
    link.href = "#";
    link.setAttribute("download", `${resource.slug}-${resource.version}.zip`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert(`📥 Thank you! Your free download of "${resource.title}" has started.`);
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutEmail) return;

    setIsPurchasing(true);
    // Simulate transaction delay
    setTimeout(() => {
      setIsPurchasing(false);
      setPurchaseComplete(true);
    }, 2000);
  };

  return (
    <Card className="p-6 bg-card border border-border space-y-5 select-none relative overflow-hidden">
      {/* Details Box Header */}
      <div className="space-y-1 border-b border-border/40 pb-4">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Resource License</span>
        <div className="flex items-baseline justify-between pt-1">
          <span className="text-2xl font-black text-foreground">
            {resource.free ? "FREE" : `$${resource.price.toFixed(2)}`}
          </span>
          <span className="text-xs text-emerald-555 font-bold uppercase tracking-wide">
            {resource.free ? "Public Access" : "Premium Asset"}
          </span>
        </div>
      </div>

      {/* File parameters list */}
      <div className="space-y-2.5 text-xs text-slate-500 border-b border-border/40 pb-4">
        <div className="flex justify-between">
          <span className="text-slate-400 font-medium">File Type</span>
          <span className="font-bold text-foreground">{resource.fileType}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400 font-medium">File Size</span>
          <span className="font-bold text-foreground">{resource.fileSize}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400 font-medium">Version</span>
          <span className="font-bold text-foreground">v{resource.version}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400 font-medium">Total Downloads</span>
          <span className="font-bold text-foreground">{resource.downloadsCount} files</span>
        </div>
      </div>

      {/* Dynamic CTA trigger area */}
      {resource.free ? (
        <Button
          onClick={handleDownload}
          className="w-full font-bold h-11 bg-primary hover:bg-blue-700 text-white flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-primary/20 transition-all hover:scale-101"
        >
          <Download className="h-4 w-4" />
          <span>Download Now</span>
        </Button>
      ) : (
        <div className="space-y-4">
          {!purchaseComplete ? (
            <form onSubmit={handleCheckoutSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Secure Delivery Email</label>
                <input
                  type="email"
                  required
                  placeholder="Enter your email to receive key"
                  value={checkoutEmail}
                  onChange={(e) => setCheckoutEmail(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50/50 dark:bg-slate-900/50 border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                />
              </div>

              <Button
                type="submit"
                disabled={isPurchasing}
                className="w-full font-bold h-11 bg-primary hover:bg-blue-700 text-white flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>{isPurchasing ? "Processing Simulated Stripe..." : "Buy Asset Now"}</span>
              </Button>
            </form>
          ) : (
            <div className="p-4 rounded-xl border border-emerald-500/25 bg-emerald-500/5 text-center space-y-3">
              <div className="h-9 w-9 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <Check className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h5 className="font-extrabold text-sm text-foreground">Payment Simulation Success!</h5>
                <p className="text-[10px] text-slate-550 leading-relaxed">
                  We sent receipt & XLSX workbook file access credentials to **{checkoutEmail}**.
                </p>
              </div>
              <Button
                onClick={() => {
                  setPurchaseComplete(false);
                  setCheckoutEmail("");
                }}
                variant="outline"
                size="sm"
                className="w-full text-[10px] h-8 bg-card border-border"
              >
                Reset Checkout Simulation
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
