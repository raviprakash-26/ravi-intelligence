"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight, Sparkles, Copy, Check, Info } from "lucide-react";
import { AnnouncementBar, Navbar, Footer } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PromptCard } from "@/components/common/cards";
import { prompts } from "@/content/prompts";

export default function PromptDetailPage() {
  const params = useParams() as { slug: string };
  const [copied, setCopied] = React.useState(false);

  const item = prompts.find((p) => p.slug === params.slug);

  if (!item) {
    return (
      <div className="min-h-screen flex flex-col justify-between select-none">
        <div>
          <AnnouncementBar />
          <Navbar />
          <div className="py-20 text-center text-slate-500 font-bold">Prompt not found.</div>
        </div>
        <Footer />
      </div>
    );
  }

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

  // Find 3 related prompts in same category
  const related = prompts
    .filter((p) => p.id !== item.id && p.category === item.category)
    .slice(0, 3);

  const finalRelated = related.length > 0 ? related : prompts.filter((p) => p.id !== item.id).slice(0, 3);

  return (
    <div className="flex flex-col min-h-screen">
      <AnnouncementBar />
      <Navbar />

      <main className="flex-grow py-10 px-4 sm:px-6 lg:px-8 bg-slate-50/40 dark:bg-transparent">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1 text-xs text-slate-500 select-none">
            <Link href="/" className="hover:underline">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/prompt-library" className="hover:underline">Prompts</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-semibold truncate max-w-[200px]">
              {item.title}
            </span>
          </nav>

          {/* Core Layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Left Column: Mockup & related details */}
            <div className="md:col-span-6 space-y-6 select-none">
              <h3 className="text-lg font-bold text-foreground">Visual Output Mockup</h3>
              <div className="aspect-square w-full rounded-2xl overflow-hidden border border-border relative bg-slate-100 dark:bg-slate-900">
                <img
                  src={item.previewImage}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4">
                  <Badge variant="glass">{item.category}</Badge>
                </div>
              </div>
            </div>

            {/* Right Column: Prompt code content */}
            <div className="md:col-span-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between select-none">
                  <Badge variant={getDiffColor(item.difficulty)} className="font-bold">
                    Difficulty: {item.difficulty}
                  </Badge>
                  <span className="text-xs text-slate-500 font-mono">Category: {item.category}</span>
                </div>
                <h1 className="text-xl sm:text-2.5xl font-extrabold tracking-tight text-foreground leading-snug">
                  {item.title}
                </h1>
              </div>

              {/* Prompt copy wrapper */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between select-none">
                  <span className="text-xs font-bold text-slate-450 uppercase tracking-wider">System Prompt Instructions</span>
                  <Button
                    variant={copied ? "secondary" : "outline"}
                    size="sm"
                    onClick={handleCopy}
                    className="h-9 px-3 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    {copied ? (
                      <>
                        Copied!
                        <Check className="h-3.5 w-3.5 ml-1" />
                      </>
                    ) : (
                      <>
                        Copy Prompt
                        <Copy className="h-3.5 w-3.5 ml-1" />
                      </>
                    )}
                  </Button>
                </div>

                <div className="p-5 bg-slate-950 text-slate-200 border border-border/80 rounded-xl font-mono text-sm leading-relaxed overflow-x-auto selection:bg-primary selection:text-white select-all">
                  <p>{item.prompt}</p>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2 select-none">
                <h4 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Related tags</h4>
                <div className="flex flex-wrap gap-1.5">
                  {item.tags.map((tag) => (
                    <Badge key={tag} variant="neutral" className="text-xs font-semibold py-0.5 px-3">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Info panel */}
              <div className="flex items-start gap-2.5 text-xs text-slate-500 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-border select-none">
                <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  To get the best results with Gemini, paste this text inside the system console settings or main chat window, replacing bracketed placeholders with your customized project requirements.
                </span>
              </div>
            </div>
          </div>

          {/* Related Prompts Row */}
          <div className="border-t border-border/40 pt-12 space-y-6">
            <h3 className="text-xl font-extrabold text-foreground select-none">Related Prompts</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl">
              {finalRelated.map((p) => (
                <PromptCard key={p.id} item={p} />
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
