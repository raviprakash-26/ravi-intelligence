"use client";

import * as React from "react";
import { Info, X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const CONSENT_KEY = "ravi-intelligence-cookie-consent";

export function CookieConsent() {
  const [showBanner, setShowBanner] = React.useState(false);

  React.useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      // Delay showing the banner for premium appearance
      const timer = setTimeout(() => setShowBanner(true), 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleConsent = (accepted: boolean) => {
    localStorage.setItem(CONSENT_KEY, accepted ? "accepted" : "declined");
    setShowBanner(false);
    // Dispatch event to toggle live trackers
    window.dispatchEvent(new Event("cookie-consent-choice"));
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] max-w-sm w-full bg-card border border-border/80 rounded-2xl p-4 shadow-2xl select-none animate-fade-in">
      <div className="space-y-4">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h5 className="font-extrabold text-xs text-foreground uppercase tracking-wider leading-none">Cookie Compliance</h5>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              We utilize analytics and performance cookies to refine your platform browsing experience. Review our terms to consent.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 text-[10px]">
          <button
            onClick={() => handleConsent(false)}
            className="px-2.5 py-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer font-bold transition-all"
          >
            Decline
          </button>
          <Button
            onClick={() => handleConsent(true)}
            size="sm"
            className="h-7 text-[10px] font-bold bg-primary text-white cursor-pointer px-3"
          >
            Accept Cookies
          </Button>
        </div>
      </div>
    </div>
  );
}
