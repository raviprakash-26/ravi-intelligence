import * as React from "react";
import Link from "next/link";
import {
  Info as InfoIcon,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Download as DownloadIcon
} from "lucide-react";
import { FAQ, MdxImage, CodeBlock } from "./mdx-client-components";

// ==========================================
// 1. CALLOUT COMPONENTS (Info, Tip, Warning, Success, Note)
// ==========================================

interface CalloutProps {
  children: React.ReactNode;
  title?: string;
}

export function Info({ children, title }: CalloutProps) {
  return (
    <div className="p-4 my-5 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-950/10 text-slate-800 dark:text-slate-350 text-sm leading-relaxed space-y-1.5">
      <div className="flex items-center gap-2 font-extrabold text-blue-900 dark:text-blue-200 select-none">
        <InfoIcon className="h-4.5 w-4.5 text-blue-500 shrink-0" />
        <span>{title || "Information"}</span>
      </div>
      <div className="pl-6.5 text-slate-700 dark:text-slate-300">{children}</div>
    </div>
  );
}

export function Tip({ children, title }: CalloutProps) {
  return (
    <div className="p-4 my-5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/10 text-slate-800 dark:text-slate-350 text-sm leading-relaxed space-y-1.5">
      <div className="flex items-center gap-2 font-extrabold text-emerald-950 dark:text-emerald-200 select-none">
        <Sparkles className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
        <span>{title || "Tip"}</span>
      </div>
      <div className="pl-6.5 text-slate-700 dark:text-slate-300">{children}</div>
    </div>
  );
}

export function Warning({ children, title }: CalloutProps) {
  return (
    <div className="p-4 my-5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/10 text-slate-800 dark:text-slate-350 text-sm leading-relaxed space-y-1.5">
      <div className="flex items-center gap-2 font-extrabold text-amber-950 dark:text-amber-200 select-none">
        <AlertTriangle className="h-4.5 w-4.5 text-amber-500 shrink-0" />
        <span>{title || "Warning"}</span>
      </div>
      <div className="pl-6.5 text-slate-700 dark:text-slate-300">{children}</div>
    </div>
  );
}

export function Success({ children, title }: CalloutProps) {
  return (
    <div className="p-4 my-5 rounded-xl border border-green-200 dark:border-green-900/50 bg-green-50/30 dark:bg-green-950/10 text-slate-800 dark:text-slate-350 text-sm leading-relaxed space-y-1.5">
      <div className="flex items-center gap-2 font-extrabold text-green-950 dark:text-green-200 select-none">
        <CheckCircle className="h-4.5 w-4.5 text-green-500 shrink-0" />
        <span>{title || "Success"}</span>
      </div>
      <div className="pl-6.5 text-slate-700 dark:text-slate-300">{children}</div>
    </div>
  );
}

export function Note({ children, title }: CalloutProps) {
  return (
    <div className="p-4 my-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-750 dark:text-slate-300 text-sm leading-relaxed space-y-1.5">
      <div className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-slate-200 select-none">
        <HelpCircle className="h-4.5 w-4.5 text-slate-500 shrink-0" />
        <span>{title || "Note"}</span>
      </div>
      <div className="pl-6.5 text-slate-700 dark:text-slate-300">{children}</div>
    </div>
  );
}

// ==========================================
// 2. MEDIA COMPONENTS (YouTube, Quote)
// ==========================================

export function YouTube({ id }: { id: string }) {
  return (
    <div className="relative w-full aspect-video my-6 rounded-xl border border-border overflow-hidden select-none">
      <iframe
        src={`https://www.youtube.com/embed/${id}`}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="absolute inset-0 w-full h-full border-0"
      />
    </div>
  );
}

export function Quote({ children, author }: { children: React.ReactNode; author?: string }) {
  return (
    <div className="border-l-4 border-primary/60 pl-4 py-1.5 my-6 italic text-slate-600 dark:text-slate-350 text-sm sm:text-base leading-relaxed bg-slate-50/50 dark:bg-slate-900/10 pr-2 rounded-r-lg">
      <div className="font-medium">&ldquo;{children}&rdquo;</div>
      {author && (
        <div className="text-xs text-slate-450 dark:text-slate-550 not-italic font-semibold mt-2 select-none">
          — {author}
        </div>
      )}
    </div>
  );
}

// ==========================================
// 3. UTILITY COMPONENTS (Download, CallToAction)
// ==========================================

interface DownloadProps {
  title: string;
  url: string;
  description?: string;
  fileType?: string;
  fileSize?: string;
}

export function Download({ title, url, description, fileType, fileSize }: DownloadProps) {
  const resolvedType = fileType || url.split('.').pop()?.toUpperCase() || "ASSET";
  const resolvedSize = fileSize || "Practice File";

  return (
    <div className="p-5 my-6 rounded-xl border border-border bg-card hover:bg-slate-50/30 dark:hover:bg-slate-900/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 select-none">
      <div className="flex items-start gap-3.5">
        <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-primary shrink-0 text-xl leading-none">
          📥
        </div>
        <div className="space-y-1">
          <div className="text-[10px] font-bold text-primary uppercase tracking-widest leading-none">Free Download</div>
          <h4 className="font-extrabold text-sm text-foreground leading-tight">{title}</h4>
          <div className="flex items-center gap-2 text-xs text-slate-450 dark:text-slate-500">
            <span>Type: {resolvedType}</span>
            <span>•</span>
            <span>Size: {resolvedSize}</span>
          </div>
        </div>
      </div>
      <a href={url} target="_blank" rel="noopener noreferrer" className="shrink-0 w-full sm:w-auto">
        <button className="w-full sm:w-auto h-9 px-4 rounded-lg bg-primary hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-primary/20 transition-all hover:scale-101">
          <DownloadIcon className="h-3.5 w-3.5" />
          <span>Download</span>
        </button>
      </a>
    </div>
  );
}

export function CallToAction({ title, desc, url, btnText }: { title: string; desc: string; url: string; btnText: string }) {
  return (
    <div className="p-6 my-8 rounded-2xl border border-border bg-slate-50 dark:bg-slate-900/20 text-center space-y-4 select-none max-w-xl mx-auto">
      <div className="space-y-1.5">
        <h3 className="font-black text-lg text-foreground leading-tight">
          {title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {desc}
        </p>
      </div>
      <Link href={url} className="inline-block">
        <button className="h-10 px-5 rounded-lg bg-primary hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-md shadow-primary/20 transition-all hover:scale-102">
          {btnText}
        </button>
      </Link>
    </div>
  );
}

// ==========================================
// 4. OVERRIDE RENDERERS (Headings)
// ==========================================

export function Heading2({ children, id }: any) {
  return (
    <h2
      id={id}
      className="group flex items-center gap-1.5 text-lg sm:text-xl font-extrabold text-foreground mt-8 mb-3 border-b border-border/40 pb-2 scroll-mt-20 relative select-text"
    >
      <span>{children}</span>
      <a
        href={`#${id}`}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-primary absolute -left-5 top-1/2 -translate-y-1/2 p-1 text-xs select-none"
        title="Copy anchor link"
      >
        #
      </a>
    </h2>
  );
}

export function Heading3({ children, id }: any) {
  return (
    <h3
      id={id}
      className="group flex items-center gap-1.5 text-base sm:text-lg font-bold text-foreground mt-6 mb-2 scroll-mt-20 relative select-text"
    >
      <span>{children}</span>
      <a
        href={`#${id}`}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-primary absolute -left-5 top-1/2 -translate-y-1/2 p-1 text-xs select-none"
        title="Copy anchor link"
      >
        #
      </a>
    </h3>
  );
}

// Aggregated Export Object for next-mdx-remote
export const mdxComponentsList = {
  Info,
  Tip,
  Warning,
  Success,
  Note,
  YouTube,
  Quote,
  Image: MdxImage,
  Download,
  CallToAction,
  FAQ,
  h2: Heading2,
  h3: Heading3,
  pre: CodeBlock
};
