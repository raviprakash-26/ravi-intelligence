"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "horizontal" | "vertical" | "icon";
  className?: string;
  iconSize?: number;
}

export function Logo({ variant = "horizontal", className, iconSize = 40 }: LogoProps) {
  // SVG Icon Component
  const LogoIcon = () => (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 transition-transform duration-200 group-hover:scale-105"
    >
      {/* Outer Squircle Container */}
      <rect
        x="6"
        y="6"
        width="88"
        height="88"
        rx="22"
        stroke="currentColor"
        strokeWidth="7"
        className="text-primary dark:text-white"
        fill="none"
      />

      {/* R Loop */}
      <path
        d="M 28 26 L 48 26 C 56 26, 56 46, 48 46 L 28 46"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary dark:text-white"
      />

      {/* R Leg */}
      <path
        d="M 42 46 L 56 74"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
        className="text-primary dark:text-white"
      />

      {/* R Stem (top part) */}
      <path
        d="M 28 26 L 28 36"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
        className="text-primary dark:text-white"
      />

      {/* R Stem (bottom part) */}
      <path
        d="M 28 64 L 28 74"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
        className="text-primary dark:text-white"
      />

      {/* I Stem */}
      <path
        d="M 72 26 L 72 74"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
        className="text-primary dark:text-white"
      />

      {/* Green Rising Bar Chart inside R stem gap */}
      {/* Bar 1 */}
      <rect
        x="25"
        y="58"
        width="6"
        height="16"
        rx="1.5"
        fill="#10B981"
      />
      {/* Bar 2 */}
      <rect
        x="34"
        y="48"
        width="6"
        height="26"
        rx="1.5"
        fill="#10B981"
      />
      {/* Bar 3 */}
      <rect
        x="43"
        y="38"
        width="6"
        height="36"
        rx="1.5"
        fill="#10B981"
      />
    </svg>
  );

  if (variant === "icon") {
    return <LogoIcon />;
  }

  if (variant === "vertical") {
    return (
      <div className={cn("flex flex-col items-center text-center space-y-3 group select-none", className)}>
        <LogoIcon />
        <div className="space-y-1.5">
          <div className="flex items-center justify-center gap-1 font-poppins tracking-wider font-extrabold uppercase">
            <span className="text-primary text-xl">Ravi</span>
            <span className="text-slate-900 dark:text-white text-xl">Intelligence</span>
          </div>
          <div className="h-[2px] w-24 bg-secondary mx-auto" />
          <p className="text-[10px] tracking-widest text-slate-500 uppercase font-semibold">
            Learn. Analyze. Grow.
          </p>
        </div>
      </div>
    );
  }

  // Horizontal variant (default)
  return (
    <div className={cn("flex items-center gap-3.5 group select-none", className)}>
      <LogoIcon />
      <div className="flex flex-col justify-center">
        {/* Branding header text */}
        <div className="flex items-baseline gap-1 font-poppins tracking-wide font-black text-lg uppercase leading-none">
          <span className="text-primary">Ravi</span>
          <span className="text-slate-900 dark:text-white">Intelligence</span>
        </div>
        {/* Horizontal thin green dividing line */}
        <div className="h-[2px] w-full bg-secondary my-1" />
        {/* Subtitle */}
        <p className="text-[9px] tracking-wider text-slate-500 uppercase font-bold leading-none">
          Learn. Analyze. Grow.
        </p>
      </div>
    </div>
  );
}
