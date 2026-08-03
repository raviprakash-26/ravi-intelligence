"use client";

import Link from "next/link";
import { MoveLeft, HelpCircle } from "lucide-react";
import { AnnouncementBar, Navbar, Footer } from "@/components/layout";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen">
      <AnnouncementBar />
      <Navbar />

      <main className="flex-grow flex items-center justify-center p-6 bg-slate-50/30 dark:bg-transparent select-none">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="h-14 w-14 rounded-full bg-slate-100 dark:bg-slate-900 border border-border text-slate-400 flex items-center justify-center mx-auto">
            <HelpCircle className="h-7 w-7" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-foreground tracking-tight leading-none">404</h1>
            <h3 className="font-extrabold text-base text-foreground">Page Not Found</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
              We couldn&apos;t locate the page you requested. It might have been moved or renamed.
            </p>
          </div>

          <div className="pt-2">
            <Link href="/">
              <Button className="h-10 text-xs font-bold bg-primary text-white cursor-pointer px-5 flex items-center gap-1.5 mx-auto">
                <MoveLeft className="h-4 w-4" />
                <span>Return to Homepage</span>
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
