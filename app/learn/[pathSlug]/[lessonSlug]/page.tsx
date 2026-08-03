import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Clock, Award, ArrowLeft, ArrowRight, CheckCircle2, ChevronLeft, Download } from "lucide-react";
import { AnnouncementBar, Navbar, Footer } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getPathBySlug, getLessonsForPath, getLessonBySlug, getAllPaths } from "@/lib/learn";
import { LessonQuiz } from "@/components/learn/learn-components";
import { BreadcrumbsSchema } from "@/components/common/seo";
import { compileMDX } from "next-mdx-remote/rsc";
import { mdxComponentsList } from "@/components/blog/mdx-components";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { Download as DownloadCard } from "@/components/blog/mdx-components";

interface PageProps {
  params: Promise<{ pathSlug: string; lessonSlug: string }>;
}

export default async function LearningLessonDetailPage({ params }: PageProps) {
  const { pathSlug, lessonSlug } = await params;
  
  const pathConfig = await getPathBySlug(pathSlug);
  const lesson = await getLessonBySlug(pathSlug, lessonSlug);

  if (!pathConfig || !lesson) {
    notFound();
  }

  // Compile MDX lesson content on the server side
  const { content: mdxContent } = await compileMDX({
    source: lesson.content,
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug],
      },
    },
    components: mdxComponentsList,
  });

  const lessonsList = await getLessonsForPath(pathSlug);
  const currentIdx = lessonsList.findIndex((l) => l.slug === lessonSlug);

  const prevLesson = currentIdx > 0 ? lessonsList[currentIdx - 1] : null;
  const nextLesson = currentIdx < lessonsList.length - 1 ? lessonsList[currentIdx + 1] : null;

  // Schema bindings
  const breadcrumbsList = [
    { name: "Home", item: "https://ravi-intelligence.com" },
    { name: "Learn", item: "https://ravi-intelligence.com/learn" },
    { name: pathConfig.title, item: `https://ravi-intelligence.com/learn/${pathConfig.slug}` },
    { name: lesson.title, item: `https://ravi-intelligence.com/learn/${pathConfig.slug}/${lesson.slug}` }
  ];

  const lessonSchema = {
    "@context": "https://schema.org",
    "@type": "CourseInstance",
    "name": lesson.title,
    "description": lesson.objectives.join(" "),
    "courseWorkload": lesson.duration,
    "isPartOf": {
      "@type": "Course",
      "name": pathConfig.title,
      "description": pathConfig.description
    }
  };

  const getDifficultyBadge = (diff: string) => {
    switch (diff.toLowerCase()) {
      case "beginner":
        return "text-green-700 bg-green-50 dark:text-green-300 dark:bg-green-950/20 border-green-200 dark:border-green-900/50";
      case "intermediate":
        return "text-amber-700 bg-amber-50 dark:text-amber-350 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50";
      case "advanced":
        return "text-rose-700 bg-rose-50 dark:text-rose-350 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50";
      default:
        return "text-primary bg-primary/5 border-primary/10";
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AnnouncementBar />
      <Navbar />

      {/* SEO schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(lessonSchema) }}
      />
      <BreadcrumbsSchema items={breadcrumbsList} />

      <main className="flex-grow py-10 px-4 sm:px-6 lg:px-8 bg-slate-50/30 dark:bg-transparent">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* Breadcrumb navigation */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium select-none">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <Link href="/learn" className="hover:text-primary transition-colors">Learn</Link>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <Link href={`/learn/${pathSlug}`} className="hover:text-primary transition-colors truncate max-w-[150px]">{pathConfig.title}</Link>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <span className="text-foreground font-semibold truncate max-w-[200px]">{lesson.title}</span>
          </nav>

          {/* Lesson main content columns grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Content column */}
            <article className="lg:col-span-8 space-y-6">
              
              {/* Header metrics */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 select-none">
                  <Badge variant="primary" className="text-[10px] py-0.5 uppercase tracking-wide">
                    Lesson {currentIdx + 1}
                  </Badge>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getDifficultyBadge(lesson.difficulty)}`}>
                    {lesson.difficulty}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-slate-400 font-bold ml-2 select-none">
                    <Clock className="h-3.5 w-3.5" />
                    {lesson.duration}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3.5xl font-black text-foreground tracking-tight leading-tight select-text">
                  {lesson.title}
                </h1>
              </div>

              {/* Objectives cards */}
              {lesson.objectives && lesson.objectives.length > 0 && (
                <Card className="p-5 bg-card border border-border select-none">
                  <h4 className="font-extrabold text-xs text-foreground uppercase tracking-widest border-b border-border/40 pb-2 mb-3">
                    Learning Objectives
                  </h4>
                  <ul className="space-y-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
                    {lesson.objectives.map((obj, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4.5 w-4.5 text-emerald-555 shrink-0 mt-0.5" />
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* MDX Compiled content */}
              <div className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-350 space-y-5 text-sm sm:text-base leading-relaxed border-t border-border/40 pt-6 select-text">
                {mdxContent}
              </div>

              {/* Download Assets */}
              {lesson.download && (
                <div className="pt-6 border-t border-border/40">
                  <DownloadCard
                    title={`${lesson.title} Practice workbook`}
                    url={lesson.download}
                    description="Follow along with the practice SQL or Excel scripts used in this lesson."
                  />
                </div>
              )}

              {/* Quiz Module */}
              {lesson.quiz && lesson.quiz.length > 0 && (
                <LessonQuiz
                  pathSlug={pathSlug}
                  lessonSlug={lessonSlug}
                  items={lesson.quiz}
                />
              )}

              {/* Bottom adjacent navigation */}
              <div className="flex items-center justify-between border-t border-border/40 pt-6 select-none gap-4">
                {prevLesson ? (
                  <Link href={`/learn/${pathSlug}/${prevLesson.slug}`}>
                    <Button variant="outline" size="sm" className="h-9 px-3 rounded-lg border-border text-xs font-bold flex items-center gap-1 cursor-pointer">
                      <ChevronLeft className="h-4 w-4" />
                      <span>Previous Lesson</span>
                    </Button>
                  </Link>
                ) : (
                  <Link href={`/learn/${pathSlug}`}>
                    <Button variant="outline" size="sm" className="h-9 px-3 rounded-lg border-border text-xs font-bold flex items-center gap-1 cursor-pointer">
                      <ChevronLeft className="h-4 w-4" />
                      <span>Curriculum Track</span>
                    </Button>
                  </Link>
                )}

                {nextLesson ? (
                  <Link href={`/learn/${pathSlug}/${nextLesson.slug}`}>
                    <Button variant="primary" size="sm" className="h-9 px-3 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer">
                      <span>Next Lesson</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <Link href={`/learn/${pathSlug}`}>
                    <Button variant="primary" size="sm" className="h-9 px-3 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer">
                      <span>Track Completed!</span>
                      <Award className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </div>

            </article>

            {/* Sidebar visual navigation (Jump unlocked nodes) */}
            <aside className="lg:col-span-4 space-y-6 select-none lg:sticky lg:top-24">
              <Card className="p-5 bg-card border border-border space-y-4">
                <h4 className="font-extrabold text-xs text-foreground uppercase tracking-widest border-b border-border/40 pb-2">
                  Lesson Navigation
                </h4>
                <div className="space-y-2.5">
                  {lessonsList.map((item, idx) => {
                    const isActive = item.slug === lessonSlug;
                    return (
                      <Link
                        key={item.id}
                        href={`/learn/${pathSlug}/${item.slug}`}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer",
                          isActive
                            ? "bg-primary/5 text-primary border-primary/20 font-bold"
                            : "bg-transparent text-slate-500 border-transparent hover:bg-slate-100 dark:hover:bg-slate-900/40 hover:text-foreground"
                        )}
                      >
                        <span className="h-5 w-5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold flex items-center justify-center border border-border">
                          {idx + 1}
                        </span>
                        <span className="truncate flex-grow">{item.title}</span>
                      </Link>
                    );
                  })}
                </div>
              </Card>
            </aside>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export async function generateStaticParams() {
  const paths = await getAllPaths();
  const params: { pathSlug: string; lessonSlug: string }[] = [];

  for (const pathConfig of paths) {
    const lessons = await getLessonsForPath(pathConfig.slug);
    lessons.forEach((lesson) => {
      params.push({
        pathSlug: pathConfig.slug,
        lessonSlug: lesson.slug,
      });
    });
  }

  return params;
}
