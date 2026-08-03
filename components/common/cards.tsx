"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Copy, Check, Download, Star, FileSpreadsheet, FileCode, Clock, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Article, NewsItem, Resource, Product, PromptItem, LearningPath } from "@/types";

/* ==========================================================================
   1. ARTICLE CARD
   ========================================================================== */
export function ArticleCard({ article }: { article: Article }) {
  return (
    <Card hoverEffect className="group flex flex-col h-full bg-card relative">
      <Link href={`/blog/${article.slug}`} className="block overflow-hidden relative aspect-video">
        <img
          src={article.coverImage}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute top-3 left-3">
          <Badge variant="primary" className="shadow-sm">
            {article.category}
          </Badge>
        </div>
      </Link>
      <CardContent className="p-5 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{article.publishedAt}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {article.readingTime} min read
            </span>
          </div>
          <Link href={`/blog/${article.slug}`} className="block">
            <h4 className="text-lg font-bold leading-snug group-hover:text-primary transition-colors line-clamp-2">
              {article.title}
            </h4>
          </Link>
          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {article.excerpt}
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-border/40 mt-5 pt-4">
          <div className="flex items-center gap-2.5">
            <img
              src={article.author.avatar}
              alt={article.author.name}
              className="h-8 w-8 rounded-full border border-border"
            />
            <div>
              <p className="text-xs font-semibold text-foreground leading-none">{article.author.name}</p>
              <p className="text-[10px] text-slate-500 leading-none mt-1">{article.author.role}</p>
            </div>
          </div>
          <Link href={`/blog/${article.slug}`} className="text-primary hover:text-blue-700 font-semibold text-xs inline-flex items-center gap-0.5 group/btn">
            Read
            <ArrowRight className="h-3 w-3 group-hover/btn:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

/* ==========================================================================
   2. NEWS CARD
   ========================================================================== */
export function NewsCard({ item }: { item: NewsItem }) {
  const getCategoryColor = (cat: string) => {
    if (cat === "AI") return "bg-primary/10 text-primary border-primary/20";
    if (cat.includes("Politics")) return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    if (cat.includes("Cinema")) return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
    return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20";
  };

  return (
    <Card hoverEffect className="group flex flex-col justify-between p-5 bg-card border-l-4 border-l-primary h-full">
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getCategoryColor(item.category)}`}>
            {item.category}
          </span>
          <span className="text-slate-500">{item.publishedAt}</span>
        </div>
        <Link href={`/news/${item.slug}`}>
          <h4 className="text-base font-bold leading-snug group-hover:text-primary transition-colors line-clamp-2">
            {item.title}
          </h4>
        </Link>
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
          {item.excerpt}
        </p>
      </div>

      <div className="flex items-center justify-between border-t border-border/40 mt-4 pt-3 text-[11px] text-slate-400">
        <span>Source: {item.source}</span>
        <Link href={`/news/${item.slug}`} className="text-primary font-bold inline-flex items-center gap-0.5 group/btn">
          Full Story
          <ArrowRight className="h-3 w-3 group-hover/btn:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </Card>
  );
}

/* ==========================================================================
   3. RESOURCE CARD
   ========================================================================== */
export function ResourceCard({ resource, onDownload }: { resource: Resource; onDownload?: () => void }) {
  return (
    <Card hoverEffect className="group flex flex-col h-full bg-card justify-between">
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-900 border-b border-border">
        <img
          src={resource.coverImage}
          alt={resource.title}
          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute bottom-3 left-3">
          <Badge variant="glass" className="font-mono">
            {resource.fileType} • {resource.fileSize}
          </Badge>
        </div>
      </div>
      <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-1.5">
          <h4 className="text-base font-bold leading-snug text-foreground">
            {resource.title}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {resource.description}
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-border/40 pt-4 mt-auto">
          <span className="text-[11px] text-slate-500">
            {resource.downloadsCount.toLocaleString()} downloads
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={onDownload}
            className="h-9 px-3 rounded-lg border-border hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer"
          >
            Download Free
            <Download className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ==========================================================================
   4. PRODUCT CARD
   ========================================================================== */
export function ProductCard({ product, onBuy }: { product: Product; onBuy?: (product: Product) => void }) {
  return (
    <Card hoverEffect className="group flex flex-col h-full bg-card justify-between relative">
      <div className="relative aspect-[16/10] overflow-hidden border-b border-border">
        <img
          src={product.coverImage}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="shadow-sm">
            {product.type}
          </Badge>
        </div>
        <div className="absolute bottom-3 left-3">
          <Badge variant="glass" className="font-mono text-[10px]">
            {product.fileType} ({product.fileSize})
          </Badge>
        </div>
      </div>

      <CardContent className="p-5 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          {/* Rating */}
          <div className="flex items-center gap-1">
            <div className="flex text-amber-500">
              <Star className="h-3.5 w-3.5 fill-current" />
            </div>
            <span className="text-xs font-bold text-foreground">{product.rating}</span>
            <span className="text-xs text-slate-500">({product.reviewsCount} reviews)</span>
          </div>

          <Link href={`/store/${product.slug}`} className="block">
            <h4 className="text-base font-bold leading-snug group-hover:text-primary transition-colors text-foreground line-clamp-2">
              {product.title}
            </h4>
          </Link>
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
            {product.description}
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-border/40 pt-4 mt-5">
          <div className="flex flex-col">
            {product.compareAtPrice && (
              <span className="text-xs line-through text-slate-400">
                ₹{product.compareAtPrice.toLocaleString("en-IN")}
              </span>
            )}
            <span className="text-lg font-extrabold text-foreground">
              ₹{product.price.toLocaleString("en-IN")}
            </span>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => onBuy?.(product)}
            className="h-9 px-3 rounded-lg text-xs font-bold cursor-pointer"
          >
            Buy Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ==========================================================================
   5. PROMPT CARD
   ========================================================================== */
export function PromptCard({ item }: { item: PromptItem }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(item.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getDiffColor = (diff: string) => {
    if (diff === "Easy") return "secondary";
    if (diff === "Medium") return "primary";
    return "accent";
  };

  return (
    <Card hoverEffect className="group bg-card p-5 h-full flex flex-col justify-between select-none">
      <div className="space-y-4">
        {/* Category & Preview */}
        <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 border border-border">
          <img
            src={item.previewImage}
            alt={item.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute top-3 left-3">
            <Badge variant="glass">{item.category}</Badge>
          </div>
          <div className="absolute top-3 right-3">
            <Badge variant={getDiffColor(item.difficulty)} className="font-bold py-0.5 px-2 text-[10px]">
              {item.difficulty}
            </Badge>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-2">
          <Link href={`/prompt-library/${item.slug}`}>
            <h4 className="text-base font-bold text-foreground hover:text-primary transition-colors">
              {item.title}
            </h4>
          </Link>
          
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-border p-3.5 rounded-lg text-[13px] font-mono leading-relaxed text-slate-600 dark:text-slate-300 relative group-hover:border-border transition-colors">
            <p className="line-clamp-3 select-all">{item.prompt}</p>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {item.tags.map((tag) => (
            <Badge key={tag} variant="neutral" className="text-[10px] font-medium py-0 px-2 bg-slate-100 dark:bg-slate-800">
              #{tag}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border/40 mt-5 pt-3">
        <Link href={`/prompt-library/${item.slug}`} className="text-xs font-bold text-primary inline-flex items-center gap-1 group/btn">
          View Details
          <ArrowRight className="h-3 w-3 group-hover/btn:translate-x-0.5 transition-transform" />
        </Link>

        <Button
          variant={copied ? "secondary" : "outline"}
          size="sm"
          onClick={handleCopy}
          className="h-8 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
        >
          {copied ? (
            <>
              Copied!
              <Check className="h-3.5 w-3.5 ml-1" />
            </>
          ) : (
            <>
              Copy
              <Copy className="h-3.5 w-3.5 ml-1" />
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}

/* ==========================================================================
   6. ROADMAP CARD
   ========================================================================== */
export function RoadmapCard({ path }: { path: LearningPath }) {
  const getDiffColor = (diff: string) => {
    if (diff === "Beginner") return "secondary";
    if (diff === "Intermediate") return "primary";
    return "accent";
  };

  return (
    <Card hoverEffect className="group flex flex-col h-full bg-card justify-between overflow-hidden p-5">
      <CardContent className="p-0 flex-grow flex flex-col justify-between h-full space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Badge variant={getDiffColor(path.difficulty)} className="font-bold border-transparent select-none">
              {path.difficulty}
            </Badge>
            <span className="text-[10px] font-bold text-slate-400 uppercase select-none">{path.duration}</span>
          </div>
          <h4 className="text-base font-bold leading-snug group-hover:text-primary transition-colors text-foreground">
            {path.title}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed line-clamp-3">
            {path.description}
          </p>
        </div>

        <div className="pt-4 border-t border-border/40 select-none">
          <Link href={`/learn/${path.slug}`} className="block">
            <Button variant="primary" className="w-full font-bold h-9 text-xs cursor-pointer">
              Start Learning Path
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
