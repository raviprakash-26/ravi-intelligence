"use client";

import * as React from "react";
import { Share2, Link as LinkIcon, Check, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ShareToolbarProps {
  title: string;
}

export function ShareToolbar({ title }: ShareToolbarProps) {
  const [copied, setCopied] = React.useState(false);
  const [currentUrl, setCurrentUrl] = React.useState("");
  const [supportNativeShare, setSupportNativeShare] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    setCurrentUrl(window.location.href);
    if (typeof navigator !== "undefined" && !!(navigator as any).share) {
      setSupportNativeShare(true);
    }

    // Only show the floating toolbar after scrolling down a bit (past the hero section)
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title: title,
        url: currentUrl
      });
    } catch (err) {
      // Ignore user cancellations
    }
  };

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(currentUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(title + " - " + currentUrl)}`
  };

  return (
    <>
      {/* 1. Desktop Vertical Floating Share Toolbar (Floats left of the article) */}
      <div
        className={cn(
          "fixed top-1/3 left-4 xl:left-12 z-30 hidden lg:flex flex-col gap-3 p-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-border/80 rounded-full shadow-lg select-none transition-all duration-300",
          isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 pointer-events-none"
        )}
      >
        {supportNativeShare && (
          <button
            onClick={handleNativeShare}
            className="h-9 w-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-foreground transition-all cursor-pointer flex items-center justify-center"
            title="System Share"
          >
            <Share2 className="h-4 w-4" />
          </button>
        )}

        <a href={shareLinks.whatsapp} target="_blank" rel="noopener noreferrer" title="Share on WhatsApp">
          <button className="h-9 w-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-emerald-555 transition-all cursor-pointer flex items-center justify-center">
            <Send className="h-4 w-4 fill-current rotate-45 -translate-y-0.5" />
          </button>
        </a>

        <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer" title="Share on X">
          <button className="h-9 w-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-foreground transition-all cursor-pointer flex items-center justify-center">
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </button>
        </a>

        <a href={shareLinks.linkedin} target="_blank" rel="noopener noreferrer" title="Share on LinkedIn">
          <button className="h-9 w-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-primary transition-all cursor-pointer flex items-center justify-center">
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z" />
            </svg>
          </button>
        </a>

        <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer" title="Share on Facebook">
          <button className="h-9 w-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-blue-600 transition-all cursor-pointer flex items-center justify-center">
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </button>
        </a>

        <button
          onClick={handleCopy}
          className="h-9 w-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-emerald-555 transition-all cursor-pointer flex items-center justify-center border-t border-border/40 mt-1 pt-1"
          title="Copy Link"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <LinkIcon className="h-4 w-4" />}
        </button>
      </div>

      {/* 2. Mobile Horizontal Floating Share Toolbar (Floats near bottom of mobile viewports) */}
      <div
        className={cn(
          "fixed bottom-20 left-1/2 -translate-x-1/2 z-35 flex lg:hidden items-center gap-4 px-5 py-2.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-border/80 rounded-full shadow-2xl transition-all duration-300",
          isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95 pointer-events-none"
        )}
      >
        <a href={shareLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-emerald-500">
          <Send className="h-4.5 w-4.5 fill-current rotate-45 -translate-y-0.5" />
        </a>
        <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-foreground">
          <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>
        <a href={shareLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-primary">
          <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z" />
          </svg>
        </a>
        <span className="w-[1px] h-4 bg-border" />
        <button onClick={handleCopy} className="text-slate-500 hover:text-emerald-500 cursor-pointer">
          {copied ? <Check className="h-4.5 w-4.5 text-emerald-555" /> : <LinkIcon className="h-4.5 w-4.5" />}
        </button>
        {supportNativeShare && (
          <button onClick={handleNativeShare} className="text-slate-500 hover:text-primary cursor-pointer">
            <Share2 className="h-4.5 w-4.5" />
          </button>
        )}
      </div>
    </>
  );
}
