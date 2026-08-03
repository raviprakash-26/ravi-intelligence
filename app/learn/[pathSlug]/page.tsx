import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Award, Clock, BookOpen } from "lucide-react";
import { AnnouncementBar, Navbar, Footer } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { getPathBySlug, getLessonsForPath, getAllPaths } from "@/lib/learn";
import { Roadmap, ProgressBar } from "@/components/learn/learn-components";
import { BreadcrumbsSchema } from "@/components/common/seo";

interface PageProps {
  params: Promise<{ pathSlug: string }>;
}

export default async function LearningPathDetailPage({ params }: PageProps) {
  const { pathSlug } = await params;
  const pathConfig = await getPathBySlug(pathSlug);

  if (!pathConfig) {
    notFound();
  }

  const lessonsList = await getLessonsForPath(pathSlug);

  // Schema mappings
  const breadcrumbsList = [
    { name: "Home", item: "https://ravi-intelligence.com" },
    { name: "Learn", item: "https://ravi-intelligence.com/learn" },
    { name: pathConfig.title, item: `https://ravi-intelligence.com/learn/${pathConfig.slug}` }
  ];

  const courseSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": pathConfig.title,
    "description": pathConfig.description,
    "provider": {
      "@type": "Organization",
      "name": "Ravi Intelligence",
      "sameAs": "https://ravi-intelligence.com"
    }
  };

  const getDifficultyBadge = (diff: string) => {
    switch (diff.toLowerCase()) {
      case "beginner":
        return "text-green-700 bg-green-50 dark:text-green-300 dark:bg-green-950/20 border-green-200 dark:border-green-900/50";
      case "intermediate":
        return "text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50";
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

      {/* SEO metadata schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchema) }}
      />
      <BreadcrumbsSchema items={breadcrumbsList} />

      <main className="flex-grow py-10 px-4 sm:px-6 lg:px-8 bg-slate-50/30 dark:bg-transparent">
        <div className="max-w-3xl mx-auto space-y-8">
          
          {/* Breadcrumb navigation */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium select-none">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <Link href="/learn" className="hover:text-primary transition-colors">Learn</Link>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <span className="text-slate-455">{pathConfig.category}</span>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <span className="text-foreground font-semibold truncate max-w-[200px]">{pathConfig.title}</span>
          </nav>

          {/* Pathway Hero Header */}
          <header className="space-y-4 pb-6 border-b border-border/40 select-none">
            <div className="flex items-center gap-2">
              <Badge variant="primary" className="text-[10px] py-0.5 uppercase tracking-wide">
                {pathConfig.category}
              </Badge>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getDifficultyBadge(pathConfig.difficulty)}`}>
                {pathConfig.difficulty}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3.5xl font-black text-foreground tracking-tight leading-tight select-text">
              {pathConfig.title}
            </h1>
            <p className="text-sm sm:text-base text-slate-550 dark:text-slate-400 leading-relaxed max-w-2xl select-text">
              {pathConfig.description}
            </p>

            {/* Metrics and course completion bar */}
            <div className="pt-3 max-w-md space-y-4">
              <div className="flex items-center gap-4 text-xs text-slate-500 font-semibold">
                <span className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4 text-slate-400" /> {pathConfig.lessonsCount} lessons
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-slate-400" /> Est. {pathConfig.duration}
                </span>
              </div>
              <ProgressBar pathSlug={pathConfig.slug} lessonSlugs={pathConfig.lessons} />
            </div>
          </header>

          {/* Visual Curriculum Nodes timeline */}
          <section className="space-y-6">
            <div className="space-y-1 select-none">
              <h3 className="font-extrabold text-base sm:text-lg text-foreground">Course Curriculum Pathway</h3>
              <p className="text-xs text-slate-500">Complete each lesson and pass knowledge check quizzes to unlock subsequent nodes.</p>
            </div>

            <Roadmap pathSlug={pathConfig.slug} lessons={lessonsList} />
          </section>

          {/* Certificate Placeholder Block */}
          <div className="p-6 rounded-2xl border border-dashed border-border bg-slate-50/50 dark:bg-slate-900/5 text-center space-y-3.5 select-none max-w-xl mx-auto">
            <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-400 flex items-center justify-center mx-auto border border-border">
              <Award className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-sm text-foreground">Course Completion Certificate</h4>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                Complete all structured curriculum lessons in this learning pathway to claim your digital verified completion badge.
              </p>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}

export async function generateStaticParams() {
  const paths = await getAllPaths();
  return paths.map((p) => ({
    pathSlug: p.slug,
  }));
}
