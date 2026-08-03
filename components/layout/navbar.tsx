"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Compass } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { GlobalSearch } from "@/components/layout/global-search";
import { Logo } from "@/components/common/logo";

export function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const pathname = usePathname();

  const navLinks = [
    { label: "Blog", href: "/blog" },
    { label: "News", href: "/news" },
    { label: "Store", href: "/store" },
    { label: "Prompt Library", href: "/prompt-library" },
    { label: "Resources", href: "/resources" },
  ];

  const isActive = (href: string) => pathname?.startsWith(href);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/">
          <Logo variant="horizontal" iconSize={36} />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive(link.href)
                  ? "text-primary border-b-2 border-primary pt-0.5"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="hidden sm:flex items-center gap-3">
          <GlobalSearch />
          <ThemeToggle />
        </div>

        {/* Mobile Actions Header */}
        <div className="flex sm:hidden items-center gap-2">
          <ThemeToggle />
          {/* Mobile hamburger button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg border border-border bg-card text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Large screen toggle button for mobile menu */}
        <div className="hidden sm:flex lg:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg border border-border bg-card text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Slide-Out */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="lg:hidden border-t border-border bg-card/95 backdrop-blur-md"
          >
            <div className="px-4 pt-4 pb-6 space-y-4 max-w-md mx-auto">
              <div className="sm:hidden">
                <GlobalSearch />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center justify-between p-3 rounded-lg border border-border text-sm font-medium transition-all hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                      isActive(link.href)
                        ? "bg-slate-50 dark:bg-slate-800/40 text-primary border-primary/50"
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <span>{link.label}</span>
                    <Compass className="h-4 w-4 opacity-55" />
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
