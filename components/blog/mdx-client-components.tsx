"use client";

import * as React from "react";
import Link from "next/link";
import { Copy, Check, ChevronDown, Download as DownloadIcon } from "lucide-react";
import { ImageLightbox } from "./reading-aids";
import { cn } from "@/lib/utils";

// 1. FAQ Client Component (Accordion toggle & Schema injection)
interface FAQItem {
  q: string;
  a: string;
}

export function FAQ({ items = [] }: { items?: FAQItem[] }) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  const faqSchema = React.useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": items.map((item) => ({
        "@type": "Question",
        "name": item.q,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": item.a
        }
      }))
    };
  }, [items]);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="my-6 border border-border rounded-xl bg-card overflow-hidden select-none">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="px-5 py-4 border-b border-border/80 bg-slate-50/50 dark:bg-slate-900/10">
        <h4 className="font-extrabold text-sm text-foreground">Frequently Asked Questions</h4>
      </div>
      <div className="divide-y divide-border/80">
        {items.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div key={idx} className="overflow-hidden">
              <button
                onClick={() => toggle(idx)}
                className="w-full px-5 py-4 flex items-center justify-between text-left font-bold text-xs text-foreground hover:bg-slate-50/40 dark:hover:bg-slate-900/10 transition-colors cursor-pointer"
              >
                <span>{item.q}</span>
                <ChevronDown
                  className={cn("h-4 w-4 text-slate-400 transition-transform duration-200", isOpen && "rotate-180")}
                />
              </button>
              <div
                className={cn(
                  "px-5 overflow-hidden transition-all duration-200 ease-in-out text-xs text-slate-500 dark:text-slate-400 leading-relaxed border-t border-transparent",
                  isOpen ? "max-h-[300px] py-4 bg-slate-50/30 dark:bg-slate-900/5 border-border/40" : "max-h-0"
                )}
              >
                {item.a}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 2. MdxImage Client Component (Image click Zoom)
export function MdxImage({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="my-6 select-none space-y-2">
      <div
        onClick={() => setIsOpen(true)}
        className="relative rounded-xl border border-border overflow-hidden cursor-zoom-in hover:shadow-md transition-shadow group"
      >
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="w-full h-auto max-h-[500px] object-cover group-hover:scale-101 transition-transform duration-350"
        />
      </div>
      {caption && (
        <p className="text-center text-xs text-slate-500 dark:text-slate-500 italic">
          {caption}
        </p>
      )}
      <ImageLightbox src={src} alt={alt} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
}

// 3. CodeBlock Client Component (Copy action & Title header)
export function CodeBlock({ children }: { children: React.ReactNode }) {
  const codeElement = React.Children.toArray(children)[0] as React.ReactElement<any>;
  const codeText = codeElement?.props?.children || "";
  const className = codeElement?.props?.className || "";
  const language = className.replace("language-", "") || "code";
  const filename = codeElement?.props?.filename || "";

  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(String(codeText).trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-6 rounded-xl border border-border bg-slate-950 dark:bg-slate-900/20 overflow-hidden select-text group">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/40 bg-slate-900 select-none">
        <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">
          {filename || language}
        </span>
        <button
          onClick={handleCopy}
          className="text-[10px] text-slate-455 hover:text-white transition-colors flex items-center gap-1 cursor-pointer focus:outline-none"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500 font-bold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-xs leading-relaxed text-slate-200 font-mono scrollbar-thin">
        {children}
      </pre>
    </div>
  );
}
