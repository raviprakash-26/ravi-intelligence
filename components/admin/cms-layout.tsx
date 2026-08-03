"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, LayoutDashboard, FileText, ShoppingBag, Sparkles, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface CmsLayoutProps {
  children: React.ReactNode;
}

export function CmsLayout({ children }: CmsLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Validate session token
    const token = localStorage.getItem("ravi-intelligence-admin-session");
    if (token === "active") {
      setAuthorized(true);
      setLoading(false);
    } else {
      router.push("/admin/login");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("ravi-intelligence-admin-session");
    router.push("/admin/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-xs text-zinc-500 font-bold uppercase tracking-widest select-none">
        Validating Admin Authorization...
      </div>
    );
  }

  if (!authorized) return null;

  const menuItems = [
    { name: "Dashboard", href: "/admin", icon: <LayoutDashboard className="h-4.5 w-4.5" /> },
    { name: "Articles", href: "/admin/articles", icon: <FileText className="h-4.5 w-4.5" /> },
    { name: "Resources", href: "/admin/resources", icon: <ShoppingBag className="h-4.5 w-4.5" /> },
    { name: "Prompts", href: "/admin/prompts", icon: <Sparkles className="h-4.5 w-4.5" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-zinc-100 flex flex-col md:flex-row select-none">
      
      {/* Sidebar Panel Column */}
      <aside className="w-full md:w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col justify-between shrink-0">
        <div className="space-y-6 py-6 px-4">
          
          {/* Logo brand */}
          <div className="flex items-center gap-2.5 px-2 select-none border-b border-zinc-800 pb-4">
            <div className="h-8.5 w-8.5 rounded-lg bg-zinc-850 flex items-center justify-center text-blue-500 border border-zinc-700/50">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
            <div>
              <h4 className="font-black text-xs uppercase tracking-widest text-zinc-100">Ravi Intel</h4>
              <p className="text-[9px] text-zinc-500 font-extrabold uppercase">CMS Administrator</p>
            </div>
          </div>

          {/* Menus List */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/10"
                      : "bg-transparent text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200"
                  )}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Log Out button */}
        <div className="p-4 border-t border-zinc-800 select-none">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-red-400 hover:bg-red-500/5 transition-all cursor-pointer border border-transparent hover:border-red-500/10"
          >
            <LogOut className="h-4.5 w-4.5" />
            <span>Log Out Panel</span>
          </button>
        </div>
      </aside>

      {/* Main content Area viewport */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-7xl mx-auto w-full">
        {children}
      </main>

    </div>
  );
}
