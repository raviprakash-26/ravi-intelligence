"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { AnnouncementBar, Navbar, Footer } from "@/components/layout";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Layout boundary error captured:", error);
  }, [error]);

  return (
    <div className="flex flex-col min-h-screen">
      <AnnouncementBar />
      <Navbar />

      <main className="flex-grow flex items-center justify-center p-6 bg-slate-50/30 dark:bg-transparent select-none">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="h-14 w-14 rounded-full bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 text-rose-500 flex items-center justify-center mx-auto">
            <AlertCircle className="h-7 w-7" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-none">Application Error</h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
              An unexpected error occurred during execution. Try reloading the viewport to retry.
            </p>
          </div>

          <div className="pt-2">
            <Button
              onClick={() => reset()}
              className="h-10 text-xs font-bold bg-primary text-white cursor-pointer px-5 flex items-center gap-1.5 mx-auto"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Retry Render</span>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
