"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionContextType {
  openValues: string[];
  toggleValue: (value: string) => void;
}

const AccordionContext = React.createContext<AccordionContextType | null>(null);

export interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "single" | "multiple";
  defaultValue?: string | string[];
}

export function Accordion({
  type = "single",
  defaultValue,
  className,
  children,
  ...props
}: AccordionProps) {
  const [openValues, setOpenValues] = React.useState<string[]>(() => {
    if (!defaultValue) return [];
    return Array.isArray(defaultValue) ? defaultValue : [defaultValue];
  });

  const toggleValue = React.useCallback(
    (value: string) => {
      setOpenValues((prev) => {
        if (type === "single") {
          return prev.includes(value) ? [] : [value];
        } else {
          return prev.includes(value)
            ? prev.filter((v) => v !== value)
            : [...prev, value];
        }
      });
    },
    [type]
  );

  return (
    <AccordionContext.Provider value={{ openValues, toggleValue }}>
      <div className={cn("space-y-2", className)} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

export interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

const AccordionItemContext = React.createContext<string | null>(null);

export function AccordionItem({ value, className, children, ...props }: AccordionItemProps) {
  return (
    <AccordionItemContext.Provider value={value}>
      <div
        className={cn(
          "border border-border rounded-xl bg-card text-foreground overflow-hidden",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

export interface AccordionTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export function AccordionTrigger({
  className,
  children,
  ...props
}: AccordionTriggerProps) {
  const context = React.useContext(AccordionContext);
  const value = React.useContext(AccordionItemContext);

  if (!context || value === null) {
    throw new Error("AccordionTrigger must be used inside AccordionItem and Accordion");
  }

  const isOpen = context.openValues.includes(value);

  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center justify-between p-5 text-left font-medium text-lg transition-all hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer",
        className
      )}
      onClick={() => context.toggleValue(value)}
      aria-expanded={isOpen}
      {...props}
    >
      {children}
      <motion.div
        animate={{ rotate: isOpen ? 180 : 0 }}
        transition={{ duration: 0.2 }}
        className="text-slate-500"
      >
        <ChevronDown className="h-5 w-5" />
      </motion.div>
    </button>
  );
}

export interface AccordionContentProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export function AccordionContent({
  className,
  children,
  ...props
}: AccordionContentProps) {
  const context = React.useContext(AccordionContext);
  const value = React.useContext(AccordionItemContext);

  if (!context || value === null) {
    throw new Error("AccordionContent must be used inside AccordionItem and Accordion");
  }

  const isOpen = context.openValues.includes(value);

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: "auto" }}
          exit={{ height: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div className={cn("p-5 pt-0 text-slate-600 dark:text-slate-300 border-t border-border/40 leading-relaxed", className)} {...props}>
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
