"use client";

import * as React from "react";
import Link from "next/link";
import { BookOpen, Check, Lock, Play, ArrowLeft, ArrowRight, Sparkles, Award, FileText, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LearningPath, LessonItem, QuizItem } from "@/types";
import { cn } from "@/lib/utils";

// LocalStorage key for progress tracking
const PROGRESS_KEY = "ravi-intelligence-learn-progress";

export function getProgress(): Record<string, string[]> {
  if (typeof window === "undefined") return {};
  const data = localStorage.getItem(PROGRESS_KEY);
  return data ? JSON.parse(data) : {};
}

export function saveProgress(pathSlug: string, lessonSlug: string) {
  if (typeof window === "undefined") return;
  const progress = getProgress();
  const completed = progress[pathSlug] || [];
  if (!completed.includes(lessonSlug)) {
    completed.push(lessonSlug);
    progress[pathSlug] = completed;
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    // Trigger custom event to notify components
    window.dispatchEvent(new Event("learn-progress-updated"));
  }
}

// ========================================================
// 1. LEARNING HERO
// ========================================================
export function LearningHero() {
  return (
    <div className="text-center max-w-3xl mx-auto space-y-4 select-none py-4">
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
        <Award className="h-3.5 w-3.5" />
        <span>Structured learning paths</span>
      </div>
      <h1 className="text-3xl sm:text-4.5xl font-black tracking-tight text-foreground leading-tight">
        Systematic Technology Learning Platform
      </h1>
      <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
        Acquire professional skills through linear, guided paths. Complete interactive lessons, download code workbooks, and test your knowledge.
      </p>
    </div>
  );
}

// ========================================================
// 2. PROGRESS BAR
// ========================================================
export function ProgressBar({ pathSlug, lessonSlugs }: { pathSlug: string; lessonSlugs: string[] }) {
  const [percent, setPercent] = React.useState(0);

  const calculatePercent = React.useCallback(() => {
    const progress = getProgress();
    const completed = progress[pathSlug] || [];
    const count = lessonSlugs.filter((s) => completed.includes(s)).length;
    const pct = lessonSlugs.length > 0 ? (count / lessonSlugs.length) * 100 : 0;
    setPercent(Math.round(pct));
  }, [pathSlug, lessonSlugs]);

  React.useEffect(() => {
    calculatePercent();
    window.addEventListener("learn-progress-updated", calculatePercent);
    return () => window.removeEventListener("learn-progress-updated", calculatePercent);
  }, [calculatePercent]);

  return (
    <div className="space-y-1.5 select-none">
      <div className="flex items-center justify-between text-xs font-bold">
        <span className="text-slate-500">Path Progress</span>
        <span className="text-primary">{percent}% Complete</span>
      </div>
      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-border/40">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

// ========================================================
// 3. LEARNING CARD
// ========================================================
export function LearningCard({ path }: { path: LearningPath }) {
  return (
    <Link href={`/learn/${path.slug}`} className="group block h-full">
      <Card hoverEffect className="overflow-hidden bg-card border border-border h-full flex flex-col justify-between p-5 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between select-none">
            <Badge variant="primary" className="text-[9px] font-bold py-0.5 px-2 uppercase tracking-wider">
              {path.category}
            </Badge>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
              {path.difficulty}
            </span>
          </div>
          <h3 className="font-extrabold text-sm sm:text-base leading-snug group-hover:text-primary transition-colors text-foreground">
            {path.title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed line-clamp-3">
            {path.description}
          </p>
        </div>

        <div className="space-y-3 pt-3 border-t border-border/40 select-none">
          <div className="flex items-center justify-between text-[10px] text-slate-450 dark:text-slate-550 font-semibold">
            <span>{path.lessonsCount} structured lessons</span>
            <span>Est. {path.duration}</span>
          </div>
          <ProgressBar pathSlug={path.slug} lessonSlugs={path.lessons} />
        </div>
      </Card>
    </Link>
  );
}

// ========================================================
// 4. INTERACTIVE ROADMAP (Visual Path Tracker)
// ========================================================
interface RoadmapProps {
  pathSlug: string;
  lessons: LessonItem[];
}

export function Roadmap({ pathSlug, lessons }: RoadmapProps) {
  const [completedList, setCompletedList] = React.useState<string[]>([]);

  const fetchProgress = React.useCallback(() => {
    const progress = getProgress();
    setCompletedList(progress[pathSlug] || []);
  }, [pathSlug]);

  React.useEffect(() => {
    fetchProgress();
    window.addEventListener("learn-progress-updated", fetchProgress);
    return () => window.removeEventListener("learn-progress-updated", fetchProgress);
  }, [fetchProgress]);

  return (
    <div className="relative pl-6 sm:pl-10 space-y-8 select-none py-4">
      {/* Central Connector Line */}
      <div className="absolute top-6 bottom-6 left-[37px] sm:left-[53px] w-[2px] bg-slate-200 dark:bg-slate-800" />

      {lessons.map((lesson, idx) => {
        const isCompleted = completedList.includes(lesson.slug);
        
        // A lesson is unlocked if it is completed, OR it is the first lesson, OR the previous lesson is completed
        const isPreviousCompleted = idx > 0 ? completedList.includes(lessons[idx - 1].slug) : false;
        const isUnlocked = idx === 0 || isCompleted || isPreviousCompleted;
        const isCurrent = isUnlocked && !isCompleted;

        return (
          <div key={lesson.id} className="relative flex gap-4 items-start group">
            
            {/* Visual Node Pin */}
            <div className="z-10 shrink-0">
              {isCompleted ? (
                <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full border border-emerald-500 bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/10">
                  <Check className="h-3 w-3 sm:h-4.5 sm:w-4.5 stroke-[3]" />
                </div>
              ) : isCurrent ? (
                <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full border border-primary bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 animate-pulse">
                  <Play className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 fill-current ml-0.5" />
                </div>
              ) : isUnlocked ? (
                <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full border-2 border-primary bg-card text-primary flex items-center justify-center">
                  <Play className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 fill-current ml-0.5" />
                </div>
              ) : (
                <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full border border-border bg-slate-50 dark:bg-slate-900 text-slate-400 flex items-center justify-center">
                  <Lock className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />
                </div>
              )}
            </div>

            {/* Content card */}
            <div className="flex-grow pt-0.5 sm:pt-1">
              <Card className={cn(
                "p-4 border transition-all h-full bg-card",
                isCurrent && "border-primary ring-1 ring-primary/10 shadow-md",
                !isUnlocked && "opacity-75 border-border bg-slate-50/20 dark:bg-slate-900/5 select-none cursor-not-allowed"
              )}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider">
                      <span>Lesson {idx + 1}</span>
                      <span>•</span>
                      <span>{lesson.duration}</span>
                      <span>•</span>
                      <span>{lesson.difficulty}</span>
                    </div>
                    {isUnlocked ? (
                      <Link href={`/learn/${pathSlug}/${lesson.slug}`} className="hover:text-primary transition-colors">
                        <h4 className="font-extrabold text-xs sm:text-sm text-foreground leading-snug">
                          {lesson.title}
                        </h4>
                      </Link>
                    ) : (
                      <h4 className="font-extrabold text-xs sm:text-sm text-slate-400 leading-snug">
                        {lesson.title}
                      </h4>
                    )}
                  </div>

                  {isUnlocked ? (
                    <Link href={`/learn/${pathSlug}/${lesson.slug}`}>
                      <Button variant={isCompleted ? "outline" : "primary"} size="sm" className="h-8 text-[10px] font-bold cursor-pointer shrink-0">
                        {isCompleted ? "Review Lesson" : "Start Lesson"}
                      </Button>
                    </Link>
                  ) : (
                    <Button disabled variant="outline" size="sm" className="h-8 text-[10px] font-bold opacity-60 shrink-0">
                      Locked Node
                    </Button>
                  )}
                </div>
              </Card>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ========================================================
// 5. LESSON QUIZ
// ========================================================
export function LessonQuiz({ pathSlug, lessonSlug, items }: { pathSlug: string; lessonSlug: string; items: QuizItem[] }) {
  const [selectedAnswers, setSelectedAnswers] = React.useState<Record<number, number>>({});
  const [submitted, setSubmitted] = React.useState(false);
  const [isCorrectMap, setIsCorrectMap] = React.useState<Record<number, boolean>>({});

  if (!items || items.length === 0) return null;

  const handleSelect = (qIdx: number, oIdx: number) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: oIdx }));
  };

  const handleSubmit = () => {
    let allPassed = true;
    const correctMap: Record<number, boolean> = {};

    items.forEach((item, qIdx) => {
      const selected = selectedAnswers[qIdx];
      const isCorrect = selected === item.correctIdx;
      correctMap[qIdx] = isCorrect;
      if (!isCorrect) allPassed = false;
    });

    setIsCorrectMap(correctMap);
    setSubmitted(true);

    if (allPassed) {
      saveProgress(pathSlug, lessonSlug);
    }
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setSubmitted(false);
    setIsCorrectMap({});
  };

  return (
    <div className="p-6 my-10 rounded-2xl border border-border bg-slate-50 dark:bg-slate-900/10 select-none space-y-6 max-w-2xl mx-auto">
      <div className="border-b border-border/60 pb-3 flex items-center justify-between">
        <h4 className="font-extrabold text-sm sm:text-base text-foreground">Knowledge check quiz</h4>
        <span className="text-[10px] text-primary font-bold uppercase tracking-widest leading-none">Lesson Assessment</span>
      </div>

      <div className="space-y-6">
        {items.map((item, qIdx) => {
          const selected = selectedAnswers[qIdx];
          const isGraded = submitted;
          const isItemCorrect = isCorrectMap[qIdx];

          return (
            <div key={qIdx} className="space-y-3">
              <p className="text-xs sm:text-sm font-bold text-foreground leading-normal">
                {qIdx + 1}. {item.question}
              </p>
              
              <div className="space-y-2">
                {item.options.map((opt, oIdx) => {
                  const isOptionSelected = selected === oIdx;
                  const isCorrectOption = oIdx === item.correctIdx;

                  let optionStyle = "border-border bg-card hover:bg-slate-50/50 dark:hover:bg-slate-900/10";
                  if (isOptionSelected) {
                    optionStyle = "border-primary ring-1 ring-primary/20 bg-primary/5 text-primary";
                  }
                  
                  if (isGraded) {
                    if (isCorrectOption) {
                      optionStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold";
                    } else if (isOptionSelected) {
                      optionStyle = "border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300";
                    } else {
                      optionStyle = "border-border opacity-50";
                    }
                  }

                  return (
                    <button
                      key={oIdx}
                      onClick={() => handleSelect(qIdx, oIdx)}
                      disabled={isGraded}
                      className={cn(
                        "w-full px-4 py-3 rounded-xl border text-xs sm:text-sm text-left transition-all leading-relaxed flex items-center justify-between cursor-pointer",
                        optionStyle
                      )}
                    >
                      <span>{opt}</span>
                      {isGraded && isCorrectOption && <Check className="h-4 w-4 text-emerald-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {isGraded && item.explanation && (
                <p className="p-3.5 rounded-lg bg-slate-100 dark:bg-slate-900/50 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed border-l-2 border-primary/50">
                  <strong>Explanation:</strong> {item.explanation}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="pt-4 border-t border-border/40 flex items-center justify-end gap-3.5">
        {submitted ? (
          <>
            {Object.values(isCorrectMap).every(Boolean) ? (
              <div className="flex items-center gap-1 text-emerald-555 text-xs font-bold leading-none select-none">
                <Check className="h-4 w-4 stroke-[3]" />
                <span>Quiz Passed! Next lesson unlocked.</span>
              </div>
            ) : (
              <Button onClick={handleReset} variant="outline" className="h-9.5 text-xs font-bold bg-card border-border">
                Retry Quiz
              </Button>
            )}
          </>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={Object.keys(selectedAnswers).length < items.length}
            className="h-9.5 px-5 font-bold text-xs bg-primary hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Submit Answers
          </Button>
        )}
      </div>
    </div>
  );
}
