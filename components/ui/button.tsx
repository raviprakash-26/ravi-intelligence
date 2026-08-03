"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent" | "outline" | "ghost";
  size?: "sm" | "md" | "lg" | "icon";
  animate?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      animate = true,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer";

    const variants = {
      primary:
        "bg-primary text-white hover:bg-blue-700 shadow-md shadow-blue-500/10 dark:shadow-none border border-transparent",
      secondary:
        "bg-secondary text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/10 dark:shadow-none border border-transparent",
      accent:
        "bg-accent text-white hover:bg-orange-600 shadow-md shadow-orange-500/10 dark:shadow-none border border-transparent",
      outline:
        "border border-border bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-foreground",
      ghost:
        "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-foreground",
    };

    const sizes = {
      sm: "h-9 px-3 text-sm",
      md: "h-11 px-5 text-base",
      lg: "h-13 px-7 text-lg rounded-xl",
      icon: "h-11 w-11 rounded-lg",
    };

    const classNames = cn(baseStyles, variants[variant], sizes[size], className);

    if (animate) {
      return (
        <motion.button
          ref={ref}
          className={classNames}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          {...(props as any)}
        >
          {children}
        </motion.button>
      );
    }

    return (
      <button ref={ref} className={classNames} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
