"use client";

import * as React from "react";
import { Share2, Link, Check, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShareButtonsProps {
  title: string;
}

export function ShareButtons({ title }: ShareButtonsProps) {
  const [copied, setCopied] = React.useState(false);
  const [currentUrl, setCurrentUrl] = React.useState("");
  const [supportNativeShare, setSupportNativeShare] = React.useState(false);

  React.useEffect(() => {
    setCurrentUrl(window.location.href);
    if (typeof navigator !== "undefined" && !!(navigator as any).share) {
      setSupportNativeShare(true);
    }
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
    <div className="flex items-center gap-2 select-none">
      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5 mr-2">
        <Share2 className="h-3.5 w-3.5" />
        Share
      </span>

      {/* Native Share button for mobile browsers */}
      {supportNativeShare && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleNativeShare}
          className="h-8 px-3 rounded-full border-border hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-1 text-xs font-semibold"
          aria-label="Native share"
        >
          <Share2 className="h-3.5 w-3.5 text-foreground" />
          <span>Share Sheet</span>
        </Button>
      )}

      {/* WhatsApp */}
      <a href={shareLinks.whatsapp} target="_blank" rel="noopener noreferrer">
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 rounded-full border-border hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-center"
          aria-label="Share on WhatsApp"
        >
          <Send className="h-3.5 w-3.5 text-emerald-500 fill-current rotate-45 -translate-y-0.5" />
        </Button>
      </a>

      {/* Twitter / X */}
      <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer">
        <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-full border-border hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-center" aria-label="Share on X">
          <svg className="h-3.5 w-3.5 fill-current text-foreground" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </Button>
      </a>

      {/* LinkedIn */}
      <a href={shareLinks.linkedin} target="_blank" rel="noopener noreferrer">
        <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-full border-border hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-center" aria-label="Share on LinkedIn">
          <svg className="h-3.5 w-3.5 fill-current text-foreground" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z" />
          </svg>
        </Button>
      </a>

      {/* Facebook */}
      <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer">
        <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-full border-border hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-center" aria-label="Share on Facebook">
          <svg className="h-3.5 w-3.5 fill-current text-foreground" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        </Button>
      </a>

      {/* Copy Link */}
      <Button
        variant={copied ? "secondary" : "outline"}
        size="sm"
        onClick={handleCopy}
        className="h-8 w-8 p-0 rounded-full border-border hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-center"
        aria-label="Copy link"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-550" /> : <Link className="h-3.5 w-3.5 text-foreground" />}
      </Button>
    </div>
  );
}
