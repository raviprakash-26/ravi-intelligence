import Link from "next/link";
import { FileText, ShoppingBag, Sparkles, Plus, ChevronRight, BarChart3, Clock } from "lucide-react";
import { CmsLayout } from "@/components/admin/cms-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAllArticles } from "@/lib/content";
import { getAllResources } from "@/lib/resources";
import { getAllPrompts } from "@/lib/prompts";

export default async function AdminDashboardPage() {
  const [articles, resources, prompts] = await Promise.all([
    getAllArticles(),
    getAllResources(),
    getAllPrompts(),
  ]);

  const stats = [
    { name: "Articles", count: articles.length, icon: <FileText className="h-5 w-5 text-blue-500" />, href: "/admin/articles", color: "bg-blue-500/5 border-blue-500/10" },
    { name: "Resources", count: resources.length, icon: <ShoppingBag className="h-5 w-5 text-emerald-500" />, href: "/admin/resources", color: "bg-emerald-500/5 border-emerald-500/10" },
    { name: "AI Prompts", count: prompts.length, icon: <Sparkles className="h-5 w-5 text-amber-500" />, href: "/admin/prompts", color: "bg-amber-500/5 border-amber-500/10" },
  ];

  return (
    <CmsLayout>
      <div className="space-y-8 select-none">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <h1 className="text-xl font-black tracking-wider uppercase text-zinc-100">CMS Overview</h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-none">Global CMS Performance Dashboard</p>
          </div>
          
          <div className="flex gap-2">
            <Link href="/admin/articles/new">
              <Button size="sm" className="h-8.5 text-[10px] font-bold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer flex items-center gap-1">
                <Plus className="h-3.5 w-3.5" /> New Article
              </Button>
            </Link>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {stats.map((stat) => (
            <Link key={stat.name} href={stat.href} className="block group">
              <Card className={`border shadow-sm transition-all group-hover:border-zinc-700 ${stat.color} bg-zinc-900/20`}>
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">{stat.name}</span>
                    <h3 className="text-2xl font-black text-zinc-100 group-hover:text-blue-500 transition-colors">
                      {stat.count}
                    </h3>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                    {stat.icon}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Staged publications list */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
          
          {/* Recent articles */}
          <Card className="lg:col-span-8 bg-zinc-900/10 border-zinc-800/80 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-zinc-450 flex items-center gap-1.5">
                <Clock className="h-4.5 w-4.5 text-blue-500" />
                <span>Recent Publications</span>
              </h4>
              <Link href="/admin/articles" className="text-[10px] font-bold text-blue-400 hover:underline uppercase">View All</Link>
            </div>

            <div className="space-y-1">
              {articles.slice(0, 5).map((art) => (
                <div key={art.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-zinc-900/50 border border-transparent transition-colors">
                  <div className="space-y-0.5 truncate pr-4">
                    <h5 className="font-extrabold text-xs text-zinc-200 truncate leading-snug">
                      {art.title}
                    </h5>
                    <div className="flex items-center gap-2 text-[9px] text-zinc-500 font-bold uppercase tracking-wider">
                      <span>{art.category}</span>
                      <span>•</span>
                      <span>{art.publishedAt}</span>
                    </div>
                  </div>
                  <Link href={`/admin/articles/edit/${art.slug}`}>
                    <Button variant="outline" size="sm" className="h-7 text-[9px] font-bold bg-zinc-950 border-zinc-800 cursor-pointer">
                      Edit
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick CMS actions list */}
          <Card className="lg:col-span-4 bg-zinc-900/10 border-zinc-800/80 p-5 space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-zinc-455 border-b border-zinc-800 pb-2">
              Quick Admin Actions
            </h4>
            <div className="space-y-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
              <Link href="/admin/resources/new" className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-850 hover:bg-zinc-900 hover:text-zinc-200 transition-all cursor-pointer">
                <span>Upload Excel Template</span>
                <ChevronRight className="h-4 w-4 text-zinc-500" />
              </Link>
              <Link href="/admin/prompts/new" className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-850 hover:bg-zinc-900 hover:text-zinc-200 transition-all cursor-pointer">
                <span>Write AI Prompt Card</span>
                <ChevronRight className="h-4 w-4 text-zinc-500" />
              </Link>
            </div>
          </Card>
        </div>

      </div>
    </CmsLayout>
  );
}
