import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, FileText, CheckCircle2, ShieldAlert, Sparkles, Clock, AlertTriangle, ArrowRight, Share2, Info } from "lucide-react";
import { AnnouncementBar, Navbar, Footer } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getPromptBySlug, getAllPrompts } from "@/lib/prompts";
import { PromptCompiler, PromptCard } from "@/components/prompts/prompt-components";
import { BreadcrumbsSchema } from "@/components/common/seo";
import { compileMDX } from "next-mdx-remote/rsc";
import { mdxComponentsList } from "@/components/blog/mdx-components";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PromptDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const prompt = await getPromptBySlug(slug);

  if (!prompt) {
    notFound();
  }

  // Compile MDX prompt details instructions
  const { content: mdxContent } = await compileMDX({
    source: prompt.content,
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug],
      },
    },
    components: mdxComponentsList,
  });

  const allPrompts = await getAllPrompts();

  // Related prompts list
  const related = allPrompts
    .filter((p) => p.id !== prompt.id && p.platform === prompt.platform)
    .slice(0, 3);
  
  const recommendations = related.length >= 3 
    ? related 
    : [
        ...related,
        ...allPrompts.filter((p) => p.id !== prompt.id && p.platform !== prompt.platform)
      ].slice(0, 3);

  // SEO schema definitions
  const breadcrumbsList = [
    { name: "Home", item: "https://ravi-intelligence.com" },
    { name: "Prompts", item: "https://ravi-intelligence.com/prompts" },
    { name: prompt.title, item: `https://ravi-intelligence.com/prompts/${prompt.slug}` }
  ];

  const creativeWorkSchema = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "name": prompt.title,
    "description": prompt.description,
    "genre": "AI Prompts",
    "creator": {
      "@type": "Person",
      "name": prompt.author
    },
    "publisher": {
      "@type": "Organization",
      "name": "Ravi Intelligence"
    },
    "datePublished": prompt.publishedAt
  };

  const getDifficultyColor = (diff: string) => {
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

      {/* SEO metadata schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(creativeWorkSchema) }}
      />
      <BreadcrumbsSchema items={breadcrumbsList} />

      <main className="flex-grow py-10 px-4 sm:px-6 lg:px-8 bg-slate-50/30 dark:bg-transparent">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* Breadcrumb line */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium select-none">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <Link href="/prompts" className="hover:text-primary transition-colors">Prompts</Link>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <span className="text-slate-455">{prompt.platform}</span>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <span className="text-foreground font-semibold truncate max-w-[200px]">{prompt.title}</span>
          </nav>

          {/* Details layout columns grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Content column */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Header titles */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-2 select-none">
                  <Badge variant="primary" className="text-[10px] py-0.5 uppercase tracking-wide">
                    {prompt.platform}
                  </Badge>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getDifficultyColor(prompt.difficulty)}`}>
                    {prompt.difficulty}
                  </span>
                  <span className="text-[10px] font-extrabold text-slate-450 dark:text-slate-550 uppercase tracking-widest ml-2">
                    {prompt.category}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3.5xl font-black text-foreground tracking-tight leading-tight select-text">
                  {prompt.title}
                </h1>
                <p className="text-sm sm:text-base text-slate-550 dark:text-slate-400 leading-relaxed font-medium select-text">
                  {prompt.description}
                </p>
              </div>

              {/* Interactive prompt variable compiler */}
              <PromptCompiler
                promptTemplate={prompt.prompt}
                variables={prompt.variables}
                title={prompt.title}
              />

              {/* Example output block */}
              {prompt.exampleOutput && (
                <Card className="p-5 border border-border bg-card space-y-3 select-none">
                  <h4 className="font-extrabold text-xs text-foreground uppercase tracking-widest border-b border-border/40 pb-2 flex items-center gap-1.5">
                    <FileText className="h-4.5 w-4.5 text-emerald-500" />
                    <span>Expected Output Example</span>
                  </h4>
                  {prompt.exampleInput && (
                    <div className="text-xs text-slate-500 leading-relaxed">
                      <strong>Input context:</strong> <span className="font-mono bg-slate-100 dark:bg-slate-900/50 px-1.5 py-0.5 rounded text-foreground">{prompt.exampleInput}</span>
                    </div>
                  )}
                  <pre className="p-4 bg-slate-950 text-slate-200 rounded-xl text-xs font-mono overflow-x-auto select-text whitespace-pre-wrap">
                    {prompt.exampleOutput}
                  </pre>
                </Card>
              )}

              {/* MDX Instruction body */}
              <div className="border-t border-border/40 pt-6">
                <div className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-350 space-y-5 text-sm sm:text-base leading-relaxed select-text">
                  {mdxContent}
                </div>
              </div>

            </div>

            {/* Right sidebar column */}
            <aside className="lg:col-span-4 space-y-6 select-none">
              
              {/* Properties Card */}
              <Card className="p-5 bg-card border border-border space-y-4">
                <h4 className="font-extrabold text-xs text-foreground uppercase tracking-widest border-b border-border/40 pb-2 leading-none">
                  Prompt Details
                </h4>
                <div className="space-y-3 text-xs text-slate-500">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Target System</span>
                    <span className="font-bold text-foreground">{prompt.platform}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Complexity</span>
                    <span className="font-bold text-foreground">{prompt.difficulty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Author</span>
                    <span className="font-bold text-foreground">{prompt.author}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Released</span>
                    <span className="font-bold text-foreground">{prompt.publishedAt}</span>
                  </div>
                  {prompt.tags && prompt.tags.length > 0 && (
                    <div className="pt-2 border-t border-border/40 space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Keywords</span>
                      <div className="flex flex-wrap gap-1.5">
                        {prompt.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[9px] font-semibold py-0.5 px-2">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Safety notice card */}
              <Card className="p-4 bg-card border border-border/80 flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h5 className="font-bold text-[11px] text-foreground uppercase tracking-wide leading-none">Variable Injection</h5>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Make sure to customize prompt inputs inside the input fields before querying the AI engine. Empty input slots will use placeholders.
                  </p>
                </div>
              </Card>
            </aside>
          </div>

          {/* Related Prompts recommendations */}
          <div className="border-t border-border/40 pt-16 mt-16 space-y-8 select-none">
            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-black text-foreground">Related Prompt Templates</h3>
              <p className="text-xs text-slate-550 dark:text-slate-455">Acquire additional prompts to speed up writing code, text files, and images.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((rec) => (
                <PromptCard key={rec.id} prompt={rec} />
              ))}
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}

export async function generateStaticParams() {
  const prompts = await getAllPrompts();
  return prompts.map((p) => ({
    slug: p.slug,
  }));
}
