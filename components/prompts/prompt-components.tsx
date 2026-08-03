"use client";

import * as React from "react";
import Link from "next/link";
import { Copy, Check, Sparkles, Terminal, FileText, CheckCircle2, ChevronRight, Share2, AlertTriangle, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PromptItem, PromptVariable } from "@/types";
import { cn } from "@/lib/utils";

// ========================================================
// 1. PLATFORM BADGE COLOR CODING
// ========================================================
export function PlatformBadge({ platform }: { platform: string }) {
  const getBadgeColor = (plat: string) => {
    switch (plat.toLowerCase()) {
      case "chatgpt":
        return "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-450";
      case "gemini":
        return "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-450";
      case "claude":
        return "bg-amber-600/10 border-amber-600/20 text-amber-700 dark:text-amber-450";
      case "midjourney":
        return "bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-450";
      case "copilot":
        return "bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-450";
      default:
        return "bg-slate-500/10 border-slate-500/20 text-slate-600 dark:text-slate-450";
    }
  };

  return (
    <span className={cn(
      "px-2.5 py-0.5 rounded-md text-[10px] font-bold border shadow-sm select-none",
      getBadgeColor(platform)
    )}>
      {platform}
    </span>
  );
}

// ========================================================
// 2. PROMPT CARD
// ========================================================
export function PromptCard({ prompt }: { prompt: PromptItem }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(prompt.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Link href={`/prompts/${prompt.slug}`} className="group block h-full">
      <Card hoverEffect className="bg-card border border-border h-full flex flex-col justify-between p-5 space-y-4">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <PlatformBadge platform={prompt.platform} />
            <span className="text-[10px] font-bold text-slate-450 uppercase select-none">
              {prompt.difficulty}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-primary uppercase tracking-wider select-none">
              {prompt.category}
            </span>
            <h3 className="font-extrabold text-sm sm:text-[15px] leading-snug group-hover:text-primary transition-colors text-foreground line-clamp-2">
              {prompt.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed line-clamp-2">
              {prompt.description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border/40 pt-3.5 select-none mt-auto">
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-550 uppercase">
            {prompt.variables.length > 0 ? `${prompt.variables.length} custom inputs` : "Static prompt"}
          </span>
          <Button
            onClick={handleCopy}
            variant="outline"
            size="sm"
            className="h-7.5 text-[10px] font-bold flex items-center gap-1 bg-card border-border cursor-pointer transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-emerald-500 stroke-[3]" />
                <span className="text-emerald-555">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 text-slate-400" />
                <span>Copy</span>
              </>
            )}
          </Button>
        </div>
      </Card>
    </Link>
  );
}

// ========================================================
// 3. PROMPT COMPILER & VARIABLE FORM WIDGET
// ========================================================
interface PromptCompilerProps {
  promptTemplate: string;
  variables: PromptVariable[];
  title: string;
}

export function PromptCompiler({ promptTemplate, variables, title }: PromptCompilerProps) {
  const [inputs, setInputs] = React.useState<Record<string, string>>({});
  const [copied, setCopied] = React.useState(false);

  // Initialize variables placeholders
  React.useEffect(() => {
    const initialInputs: Record<string, string> = {};
    variables.forEach((v) => {
      initialInputs[v.name] = "";
    });
    setInputs(initialInputs);
  }, [variables]);

  const handleInputChange = (name: string, val: string) => {
    setInputs((prev) => ({ ...prev, [name]: val }));
  };

  // Compile prompt dynamically based on user keypress
  const compiledPrompt = React.useMemo(() => {
    let result = promptTemplate;
    variables.forEach((v) => {
      const userValue = inputs[v.name];
      const fallbackVal = userValue && userValue.trim() !== "" ? userValue : `[${v.name}]`;
      // Replace instances inside template
      result = result.split(`[${v.name}]`).join(fallbackVal);
    });
    return result;
  }, [promptTemplate, variables, inputs]);

  const handleCopy = () => {
    navigator.clipboard.writeText(compiledPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 select-none">
      
      {/* Variable Form Sheets */}
      {variables.length > 0 && (
        <Card className="p-5 bg-card border border-border space-y-4">
          <h4 className="font-extrabold text-xs text-foreground uppercase tracking-widest border-b border-border/40 pb-2 mb-3 flex items-center gap-1.5">
            <Terminal className="h-4.5 w-4.5 text-primary" />
            <span>Customize Prompt Variables</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {variables.map((v) => (
              <div key={v.name} className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  {v.name.replace(/([A-Z])/g, " $1")}
                </label>
                <input
                  type="text"
                  placeholder={v.placeholder}
                  value={inputs[v.name] || ""}
                  onChange={(e) => handleInputChange(v.name, e.target.value)}
                  className="w-full h-9.5 px-3 bg-slate-50/50 dark:bg-slate-900/50 border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Compiled Prompt Editor Output */}
      <Card className="border border-border/80 overflow-hidden relative shadow-sm">
        {/* Editor Tab Bar */}
        <div className="bg-slate-50 dark:bg-slate-900/60 px-4 py-2 border-b border-border/50 flex items-center justify-between text-xs text-slate-450 select-none">
          <span className="font-mono flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            Active prompt compiler
          </span>
          <Button
            onClick={handleCopy}
            variant="outline"
            size="sm"
            className="h-7.5 px-3.5 text-[10px] font-bold bg-card border-border flex items-center gap-1 cursor-pointer transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-emerald-500 stroke-[3]" />
                <span className="text-emerald-555 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 text-slate-400" />
                <span>Copy Prompt</span>
              </>
            )}
          </Button>
        </div>

        {/* Text Area */}
        <div className="p-4 bg-slate-50/20 dark:bg-slate-900/5 select-text font-mono text-xs sm:text-sm leading-relaxed text-slate-750 dark:text-slate-350 min-h-[140px] whitespace-pre-wrap">
          {compiledPrompt}
        </div>
      </Card>
    </div>
  );
}
