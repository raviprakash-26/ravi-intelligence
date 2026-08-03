import Link from "next/link";
import { ShieldCheck, Calendar, Activity, AlertCircle, Link2, Sparkles, TrendingUp, Search, Mail, CheckCircle2, FileText, ShoppingBag } from "lucide-react";
import { CmsLayout } from "@/components/admin/cms-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAllArticles } from "@/lib/content";
import { getAllResources } from "@/lib/resources";
import { getAllPaths } from "@/lib/learn";
import { getAllPrompts } from "@/lib/prompts";

export default async function AdminGrowthDashboardPage() {
  const [articles, resources, paths, prompts] = await Promise.all([
    getAllArticles(),
    getAllResources(),
    getAllPaths(),
    getAllPrompts(),
  ]);

  // 1. Content Aggregations
  const totalArticles = articles.length;
  const totalResources = resources.length;
  const totalPrompts = prompts.length;
  
  // Calculate lessons count
  let totalLessons = 0;
  paths.forEach((p) => {
    totalLessons += p.lessons.length;
  });

  const now = new Date();
  const thisMonthString = now.toISOString().substring(0, 7); // e.g. "2026-08"

  const publishedThisMonth = 
    articles.filter((a) => a.publishedAt.startsWith(thisMonthString)).length +
    resources.filter((r) => r.publishedAt.startsWith(thisMonthString)).length +
    prompts.filter((p) => p.publishedAt.startsWith(thisMonthString)).length;

  // SEO Health Audits
  const missingDescription = [
    ...articles.filter((a) => !a.excerpt).map((a) => ({ title: a.title, type: "Article", slug: a.slug })),
    ...resources.filter((r) => !r.description).map((r) => ({ title: r.title, type: "Resource", slug: r.slug })),
    ...prompts.filter((p) => !p.description).map((p) => ({ title: p.title, type: "Prompt", slug: p.slug })),
  ];

  const missingImage = [
    ...articles.filter((a) => !a.coverImage).map((a) => ({ title: a.title, type: "Article", slug: a.slug })),
    ...resources.filter((r) => !r.coverImage).map((r) => ({ title: r.title, type: "Resource", slug: r.slug })),
  ];

  const articlesWithoutTags = articles.filter((a) => !a.tags || a.tags.length === 0);

  // Content calendar: plot publications scheduled
  const calendarItems = [
    { title: "Excel Finance Modeling Tutorial", date: "Aug 05, 2026", type: "Tutorial" },
    { title: "SQL Window Functions Cheatsheet", date: "Aug 12, 2026", type: "Resource" },
    { title: "ChatGPT Marketing Persona Prompt", date: "Aug 18, 2026", type: "Prompt" },
    { title: "Ravi Intelligence V2 Release Announcement", date: "Aug 24, 2026", type: "News" },
    { title: "Corporate Budget Dashboard Workbook", date: "Aug 30, 2026", type: "Product" },
  ];

  // Cross-linking Engine: suggest internal references sharing matching tags
  const linkingSuggestions: { from: string; to: string; reason: string }[] = [];
  articles.forEach((art) => {
    // If art has 'sql' tag, suggest linking to resource dataset
    if (art.tags.some((t) => t.toLowerCase() === "sql")) {
      const matchRes = resources.find((r) => r.tags.some((t) => t.toLowerCase() === "sql"));
      if (matchRes) {
        linkingSuggestions.push({
          from: art.title,
          to: matchRes.title,
          reason: "Both share the key theme tag 'SQL'",
        });
      }
    }
    // If art has 'excel' tag, suggest linking to excel prompt
    if (art.tags.some((t) => t.toLowerCase() === "excel")) {
      const matchPr = prompts.find((p) => p.category.toLowerCase() === "excel" || p.tags.some((t) => t.toLowerCase() === "excel"));
      if (matchPr) {
        linkingSuggestions.push({
          from: art.title,
          to: matchPr.title,
          reason: "Both share the key theme tag 'Excel'",
        });
      }
    }
  });

  return (
    <CmsLayout>
      <div className="space-y-8 select-none text-zinc-100 bg-zinc-950">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <h1 className="text-xl font-black tracking-wider uppercase text-zinc-100">SEO & Growth Panel</h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-none">Automated Audits & Conversion Systems</p>
          </div>
        </header>

        {/* Content aggregates counts */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-zinc-900/30 border-zinc-850 p-4">
            <span className="text-[9px] font-bold text-zinc-550 uppercase tracking-wider block">Total Articles</span>
            <span className="text-xl font-black text-zinc-150">{totalArticles}</span>
          </Card>
          <Card className="bg-zinc-900/30 border-zinc-850 p-4">
            <span className="text-[9px] font-bold text-zinc-550 uppercase tracking-wider block">Total Lessons</span>
            <span className="text-xl font-black text-zinc-150">{totalLessons}</span>
          </Card>
          <Card className="bg-zinc-900/30 border-zinc-850 p-4">
            <span className="text-[9px] font-bold text-zinc-550 uppercase tracking-wider block">Total Resources</span>
            <span className="text-xl font-black text-zinc-150">{totalResources}</span>
          </Card>
          <Card className="bg-zinc-900/30 border-zinc-850 p-4">
            <span className="text-[9px] font-bold text-zinc-550 uppercase tracking-wider block">Total Prompts</span>
            <span className="text-xl font-black text-zinc-150">{totalPrompts}</span>
          </Card>
          <Card className="bg-zinc-900/30 border-zinc-850 p-4">
            <span className="text-[9px] font-bold text-zinc-550 uppercase tracking-wider block">New This Month</span>
            <span className="text-xl font-black text-blue-500">{publishedThisMonth}</span>
          </Card>
        </div>

        {/* Mocks Analytics & Traffic Statistics widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-zinc-900/10 border-zinc-800 p-5 space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-zinc-450 flex items-center gap-1.5 border-b border-zinc-800 pb-2">
              <Search className="h-4.5 w-4.5 text-blue-500" />
              <span>Google Search Console</span>
            </h4>
            <div className="space-y-3.5">
              <div className="flex justify-between items-baseline border-b border-zinc-850/40 pb-2">
                <span className="text-[10px] text-zinc-450 uppercase font-bold">Impressions</span>
                <span className="text-sm font-black text-zinc-200">142.8K</span>
              </div>
              <div className="flex justify-between items-baseline border-b border-zinc-850/40 pb-2">
                <span className="text-[10px] text-zinc-450 uppercase font-bold">Clicks</span>
                <span className="text-sm font-black text-zinc-200">12.4K</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] text-zinc-450 uppercase font-bold">Average CTR</span>
                <span className="text-sm font-black text-blue-500">8.7%</span>
              </div>
            </div>
          </Card>

          <Card className="bg-zinc-900/10 border-zinc-800 p-5 space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-zinc-450 flex items-center gap-1.5 border-b border-zinc-800 pb-2">
              <Activity className="h-4.5 w-4.5 text-emerald-500" />
              <span>Google Analytics GA4</span>
            </h4>
            <div className="space-y-3.5">
              <div className="flex justify-between items-baseline border-b border-zinc-850/40 pb-2">
                <span className="text-[10px] text-zinc-450 uppercase font-bold">Session Users</span>
                <span className="text-sm font-black text-zinc-200">45.2K</span>
              </div>
              <div className="flex justify-between items-baseline border-b border-zinc-850/40 pb-2">
                <span className="text-[10px] text-zinc-450 uppercase font-bold">Bounce Rate</span>
                <span className="text-sm font-black text-zinc-200">32.4%</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] text-zinc-450 uppercase font-bold">Avg Session Duration</span>
                <span className="text-sm font-black text-emerald-500">2m 45s</span>
              </div>
            </div>
          </Card>

          <Card className="bg-zinc-900/10 border-zinc-800 p-5 space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-zinc-450 flex items-center gap-1.5 border-b border-zinc-800 pb-2">
              <Mail className="h-4.5 w-4.5 text-amber-500" />
              <span>Newsletter growth</span>
            </h4>
            <div className="space-y-3.5">
              <div className="flex justify-between items-baseline border-b border-zinc-850/40 pb-2">
                <span className="text-[10px] text-zinc-450 uppercase font-bold">Subscribers</span>
                <span className="text-sm font-black text-zinc-200">2,854</span>
              </div>
              <div className="flex justify-between items-baseline border-b border-zinc-850/40 pb-2">
                <span className="text-[10px] text-zinc-450 uppercase font-bold">Open Rate</span>
                <span className="text-sm font-black text-zinc-200">48.2%</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] text-zinc-450 uppercase font-bold">Click Rate</span>
                <span className="text-sm font-black text-amber-550">14.8%</span>
              </div>
            </div>
          </Card>
        </div>

        {/* SEO health audit list */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* SEO checker */}
          <Card className="lg:col-span-6 bg-zinc-900/10 border-zinc-800 p-5 space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5 border-b border-zinc-850 pb-2">
              <AlertCircle className="h-4.5 w-4.5 text-red-500" />
              <span>SEO Health Audit Warnings</span>
            </h4>

            {missingDescription.length === 0 && missingImage.length === 0 && articlesWithoutTags.length === 0 ? (
              <p className="text-[10px] text-emerald-500 font-bold uppercase py-4">✓ No SEO health warnings detected! Your content is optimized.</p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto scrollbar-thin">
                {missingDescription.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start p-2.5 rounded-lg border border-red-500/10 bg-red-500/5 text-xs">
                    <div className="space-y-0.5 truncate pr-2">
                      <span className="font-extrabold text-zinc-200 block truncate">{item.title}</span>
                      <span className="text-[9px] text-zinc-500 uppercase font-bold">{item.type}</span>
                    </div>
                    <Badge variant="glass" className="text-[8px] border-red-500/30 text-red-400 shrink-0 uppercase font-bold">
                      Missing Meta Description
                    </Badge>
                  </div>
                ))}

                {missingImage.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start p-2.5 rounded-lg border border-amber-500/10 bg-amber-500/5 text-xs">
                    <div className="space-y-0.5 truncate pr-2">
                      <span className="font-extrabold text-zinc-200 block truncate">{item.title}</span>
                      <span className="text-[9px] text-zinc-500 uppercase font-bold">{item.type}</span>
                    </div>
                    <Badge variant="glass" className="text-[8px] border-amber-500/30 text-amber-450 shrink-0 uppercase font-bold">
                      Missing Cover Image
                    </Badge>
                  </div>
                ))}

                {articlesWithoutTags.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start p-2.5 rounded-lg border border-purple-500/10 bg-purple-500/5 text-xs">
                    <div className="space-y-0.5 truncate pr-2">
                      <span className="font-extrabold text-zinc-200 block truncate">{item.title}</span>
                      <span className="text-[9px] text-zinc-500 uppercase font-bold">Article</span>
                    </div>
                    <Badge variant="glass" className="text-[8px] border-purple-500/30 text-purple-400 shrink-0 uppercase font-bold">
                      No tags configured
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Cross-linking recommendations */}
          <Card className="lg:col-span-6 bg-zinc-900/10 border-zinc-800 p-5 space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-zinc-405 flex items-center gap-1.5 border-b border-zinc-850 pb-2">
              <Link2 className="h-4.5 w-4.5 text-blue-500" />
              <span>Internal Cross-Linking Engine</span>
            </h4>

            {linkingSuggestions.length === 0 ? (
              <p className="text-[10px] text-zinc-500 font-bold uppercase py-4">No content tag overlap suggestions found yet.</p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto scrollbar-thin">
                {linkingSuggestions.slice(0, 6).map((suggest, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-zinc-850 bg-zinc-900/40 space-y-1.5 text-xs">
                    <div className="font-extrabold text-zinc-250 leading-snug">
                      Suggest linking: <span className="text-blue-400 font-black">&quot;{suggest.from}&quot;</span> → <span className="text-emerald-400 font-black">&quot;{suggest.to}&quot;</span>
                    </div>
                    <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">
                      Reason: {suggest.reason}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Content Checklist & Publishing Agenda */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Content Checklist */}
          <Card className="lg:col-span-7 bg-zinc-900/10 border-zinc-800 p-5 space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5 border-b border-zinc-850 pb-2">
              <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
              <span>Editorial SEO Checklist (Recent Articles)</span>
            </h4>
            
            <div className="space-y-4 max-h-[350px] overflow-y-auto scrollbar-thin">
              {articles.slice(0, 4).map((art) => {
                const checkImg = art.coverImage ? "text-emerald-500" : "text-zinc-600";
                const checkTitle = art.title.length > 10 ? "text-emerald-500" : "text-zinc-600";
                const checkDesc = art.excerpt ? "text-emerald-500" : "text-zinc-600";
                const checkCat = art.category ? "text-emerald-500" : "text-zinc-600";
                const checkTags = art.tags && art.tags.length > 0 ? "text-emerald-500" : "text-zinc-600";
                
                return (
                  <div key={art.id} className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-850 space-y-2">
                    <div className="flex justify-between items-baseline border-b border-zinc-800 pb-1.5 select-text">
                      <span className="font-extrabold text-xs text-zinc-200 truncate">{art.title}</span>
                      <span className="text-[9px] text-zinc-500 font-mono">/{art.slug}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[9px] font-bold uppercase tracking-wider pt-0.5">
                      <span className={`flex items-center gap-1 ${checkImg}`}>
                        ● Cover Image
                      </span>
                      <span className={`flex items-center gap-1 ${checkTitle}`}>
                        ● Meta Title
                      </span>
                      <span className={`flex items-center gap-1 ${checkDesc}`}>
                        ● Description
                      </span>
                      <span className={`flex items-center gap-1 ${checkCat}`}>
                        ● Category
                      </span>
                      <span className={`flex items-center gap-1 ${checkTags}`}>
                        ● Tags Array
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Content Calendar */}
          <Card className="lg:col-span-5 bg-zinc-900/10 border-zinc-800 p-5 space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5 border-b border-zinc-850 pb-2">
              <Calendar className="h-4.5 w-4.5 text-blue-500" />
              <span>Publishing Content Calendar</span>
            </h4>

            <div className="space-y-3">
              {calendarItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 rounded-lg border border-zinc-850 bg-zinc-900/30 text-xs">
                  <div className="space-y-0.5 truncate pr-2">
                    <span className="font-extrabold text-zinc-200 block truncate">{item.title}</span>
                    <span className="text-[9px] text-zinc-500 font-mono font-bold uppercase">{item.type}</span>
                  </div>
                  <span className="text-[10px] text-zinc-450 font-mono font-bold shrink-0">{item.date}</span>
                </div>
              ))}
            </div>
          </Card>

        </div>

      </div>
    </CmsLayout>
  );
}
