"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Edit2, Trash2, Search, ExternalLink, ShieldAlert } from "lucide-react";
import { CmsLayout } from "@/components/admin/cms-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CMSItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  publishedAt: string;
  author: string;
}

interface CmsListClientProps {
  type: "article" | "resource" | "prompt";
  items: any[];
}

export function CmsListClient({ type, items }: CmsListClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const filteredItems = React.useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.slug.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  const handleDelete = async (slug: string, category: string) => {
    if (!confirm(`⚠️ Are you sure you want to delete this ${type}? This action cannot be undone.`)) return;

    setDeletingId(slug);
    try {
      const res = await fetch("/api/admin/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, slug, category }),
      });

      if (res.ok) {
        alert(`🗑️ Successfully deleted ${type}: "${slug}"`);
        router.refresh(); // Triggers server-side data refresh
      } else {
        const err = await res.json();
        alert(`Error deleting item: ${err.error}`);
      }
    } catch (e: any) {
      alert(`Network error: ${e.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const getPublicUrl = (slug: string) => {
    switch (type) {
      case "article":
        return `/blog/${slug}`;
      case "resource":
        return `/resources/${slug}`;
      case "prompt":
        return `/prompts/${slug}`;
      default:
        return "/";
    }
  };

  return (
    <CmsLayout>
      <div className="space-y-6 select-none">
        
        {/* Header toolbar */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <h1 className="text-lg font-black tracking-wider uppercase text-zinc-100">
              {type}s Catalog Directory
            </h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-none">Content Listings & Actions</p>
          </div>

          <Link href={`/admin/${type}s/new`}>
            <Button size="sm" className="h-9 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer flex items-center gap-1.5 px-4 shadow-lg shadow-blue-500/10">
              <Plus className="h-4 w-4" />
              <span>Create {type}</span>
            </Button>
          </Link>
        </header>

        {/* Filter bar */}
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder={`Search ${type}s...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9.5 pl-9 pr-4 bg-zinc-900 border border-zinc-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-200"
          />
        </div>

        {/* Items list */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-zinc-800 rounded-xl space-y-2 bg-zinc-900/10">
            <ShieldAlert className="h-8 w-8 text-zinc-650 mx-auto opacity-70" />
            <h4 className="font-extrabold text-xs text-zinc-400 uppercase tracking-widest">No items found</h4>
            <p className="text-[10px] text-zinc-550">Try modifying search tags or write a new document.</p>
          </div>
        ) : (
          <div className="border border-zinc-800 rounded-xl overflow-hidden shadow-sm bg-zinc-900/10">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-zinc-900 text-zinc-500 font-bold uppercase text-[9px] tracking-widest border-b border-zinc-800">
                  <tr>
                    <th className="p-4">Title</th>
                    <th className="p-4 hidden sm:table-cell">Category</th>
                    <th className="p-4 hidden sm:table-cell">Publish Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-medium">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="p-4 space-y-0.5 truncate max-w-[200px] sm:max-w-xs select-text">
                        <span className="font-extrabold text-zinc-200 leading-snug block truncate">{item.title}</span>
                        <span className="text-[10px] text-zinc-500 block truncate">/{type}s/{item.slug}</span>
                      </td>
                      <td className="p-4 hidden sm:table-cell">
                        <Badge variant="secondary" className="text-[9px] font-bold py-0.5 uppercase">
                          {item.category}
                        </Badge>
                      </td>
                      <td className="p-4 hidden sm:table-cell text-zinc-450 font-mono">
                        {item.publishedAt}
                      </td>
                      <td className="p-4 text-right select-none">
                        <div className="inline-flex items-center gap-1.5">
                          <Link href={getPublicUrl(item.slug)} target="_blank">
                            <button className="h-8 w-8 rounded-lg border border-zinc-800 hover:bg-zinc-900 flex items-center justify-center cursor-pointer text-zinc-400">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </button>
                          </Link>
                          <Link href={`/admin/${type}s/edit/${item.slug}`}>
                            <button className="h-8 w-8 rounded-lg border border-zinc-800 hover:bg-zinc-900 flex items-center justify-center cursor-pointer text-blue-400">
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                          </Link>
                          <button
                            onClick={() => handleDelete(item.slug, item.category)}
                            disabled={deletingId === item.slug}
                            className="h-8 w-8 rounded-lg border border-zinc-800 hover:bg-red-500/5 flex items-center justify-center cursor-pointer text-red-400 disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </CmsLayout>
  );
}
