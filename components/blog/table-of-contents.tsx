"use client";

import * as React from "react";
import { List } from "lucide-react";

interface HeadingItem {
  text: string;
  id: string;
  level: number;
}

export function TableOfContents({ content }: { content: string }) {
  const [headings, setHeadings] = React.useState<HeadingItem[]>([]);
  const [activeId, setActiveId] = React.useState("");

  React.useEffect(() => {
    // Regular expression to find headings like "## Section Name" or "### Section Name"
    const headingRegex = /^(#{2,3})\s+(.*)$/gm;
    const items: HeadingItem[] = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      items.push({ text, id, level });
    }

    setHeadings(items);

    // Scroll listener to highlight active header
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "0px 0px -60% 0px" }
    );

    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [content]);

  if (headings.length === 0) return null;

  const handleScroll = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="space-y-4 select-none">
      <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-2">
        <List className="h-4 w-4 text-primary" />
        Table of Contents
      </h4>
      <nav className="space-y-2">
        {headings.map((heading) => (
          <button
            key={heading.id}
            onClick={() => handleScroll(heading.id)}
            className={`block text-left text-xs font-semibold hover:text-primary transition-colors cursor-pointer w-full leading-relaxed ${
              activeId === heading.id
                ? "text-primary border-l-2 border-primary pl-2"
                : "text-slate-550 dark:text-slate-400 pl-2"
            } ${heading.level === 3 ? "ml-3 font-medium opacity-85" : ""}`}
          >
            {heading.text}
          </button>
        ))}
      </nav>
    </div>
  );
}
