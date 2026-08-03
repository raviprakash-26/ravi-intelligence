"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export function AnnouncementBar() {
  return (
    <div className="bg-primary text-white text-xs font-semibold py-2 px-4 flex items-center justify-center gap-2 relative z-50 text-center selection:bg-white selection:text-primary">
      <Sparkles className="h-3.5 w-3.5 animate-pulse text-amber-300" />
      <span>Launch Promo: Use code <span className="underline font-mono">GROW20</span> for 20% off all templates and courses!</span>
      <Link
        href="/store"
        className="inline-flex items-center gap-0.5 hover:underline ml-1 group"
      >
        Shop Now
        <motion.span
          className="inline-block"
          animate={{ x: [0, 4, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        >
          <ArrowRight className="h-3 w-3" />
        </motion.span>
      </Link>
    </div>
  );
}
