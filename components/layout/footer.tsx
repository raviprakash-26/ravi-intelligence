"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { NewsletterForm } from "@/components/ui/newsletter-form";
import { Logo } from "@/components/common/logo";

export function Footer() {
  const footerLinks = [
    {
      title: "Resources & Prompts",
      links: [
        { label: "Excel Templates", href: "/resources" },
        { label: "Power BI Layouts", href: "/resources" },
        { label: "Gemini Prompts", href: "/prompt-library" },
      ],
    },
    {
      title: "Latest News",
      links: [
        { label: "Technology News", href: "/news?cat=Technology" },
        { label: "Artificial Intelligence", href: "/news?cat=AI" },
        { label: "Business & Economy", href: "/news?cat=Business" },
        { label: "Politics (India & TN)", href: "/news" },
        { label: "Cinema News", href: "/news" },
      ],
    },
    {
      title: "Platform",
      links: [
        { label: "Digital Store", href: "/store" },
        { label: "Free Resources", href: "/resources" },
        { label: "About Us", href: "/" },
      ],
    },
  ];

  return (
    <footer className="border-t border-border bg-slate-50 dark:bg-[#070b12] py-16 px-4 sm:px-6 lg:px-8 relative z-10 select-none">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Company Pitch & Newsletter */}
        <div className="lg:col-span-5 space-y-6">
          <Logo variant="horizontal" iconSize={36} />
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
            India&apos;s most trusted learning platform for Analytics, AI, Finance, Accounting, Technology, and Career Development. Premium editorial, structured syllabi, and rich tools.
          </p>
          <div className="max-w-md">
            <h4 className="text-sm font-semibold text-foreground mb-2">
              Subscribe to our editorial newsletter
            </h4>
            <NewsletterForm />
          </div>
        </div>

        {/* Links Navigation */}
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
          {footerLinks.map((section) => (
            <div key={section.title} className="space-y-4">
              <h5 className="text-sm font-bold tracking-wider text-slate-400 uppercase">
                {section.title}
              </h5>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary transition-colors flex items-center gap-1 group"
                    >
                      <span>{link.label}</span>
                      <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Copyright Notice */}
      <div className="max-w-7xl mx-auto border-t border-border/40 mt-16 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        <p>&copy; {new Date().getFullYear()} Ravi Intelligence. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <Link href="/" className="hover:underline">Privacy Policy</Link>
          <Link href="/" className="hover:underline">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}
