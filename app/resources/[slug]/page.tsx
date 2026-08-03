import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, FileText, CheckCircle2, ShieldAlert, Cpu } from "lucide-react";
import { AnnouncementBar, Navbar, Footer } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getResourceBySlug, getAllResources } from "@/lib/resources";
import { BreadcrumbsSchema } from "@/components/common/seo";
import { compileMDX } from "next-mdx-remote/rsc";
import { mdxComponentsList } from "@/components/blog/mdx-components";
import { ResourceGallery, DownloadCard, ResourceCard } from "@/components/resources/resource-components";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ResourceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const resource = await getResourceBySlug(slug);

  if (!resource) {
    notFound();
  }

  // Compile MDX descriptions on the server side
  const { content: mdxContent } = await compileMDX({
    source: resource.content,
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug],
      },
    },
    components: mdxComponentsList,
  });

  const allResources = await getAllResources();

  // Fetch exactly 3 related resources
  const related = allResources
    .filter((r) => r.id !== resource.id && r.category === resource.category)
    .slice(0, 3);
  
  const recommendations = related.length >= 3 
    ? related 
    : [
        ...related,
        ...allResources.filter((r) => r.id !== resource.id && r.category !== resource.category)
      ].slice(0, 3);

  // Schema mappings
  const breadcrumbsList = [
    { name: "Home", item: "https://ravi-intelligence.com" },
    { name: "Resources", item: "https://ravi-intelligence.com/resources" },
    { name: resource.title, item: `https://ravi-intelligence.com/resources/${resource.slug}` }
  ];

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": resource.title,
    "image": resource.coverImage,
    "description": resource.description,
    "category": resource.category,
    "offers": {
      "@type": "Offer",
      "price": resource.free ? "0.00" : resource.price.toString(),
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "url": `https://ravi-intelligence.com/resources/${resource.slug}`
    }
  };

  const getDifficultyBadge = (diff: string) => {
    switch (diff.toLowerCase()) {
      case "beginner":
        return "text-green-700 bg-green-50 dark:text-green-300 dark:bg-green-950/20 border-green-200 dark:border-green-900/50";
      case "intermediate":
        return "text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50";
      case "advanced":
        return "text-rose-700 bg-rose-50 dark:text-rose-300 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50";
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <BreadcrumbsSchema items={breadcrumbsList} />

      <main className="flex-grow py-10 px-4 sm:px-6 lg:px-8 bg-slate-50/30 dark:bg-transparent">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* Breadcrumb row */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium select-none">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <Link href="/resources" className="hover:text-primary transition-colors">Resources</Link>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <span className="text-slate-455">{resource.category}</span>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <span className="text-foreground font-semibold truncate max-w-[200px] sm:max-w-xs">{resource.title}</span>
          </nav>

          {/* Large Hero Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Content column */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Screenshots gallery or cover display */}
              {resource.previewImages && resource.previewImages.length > 0 ? (
                <ResourceGallery images={resource.previewImages} title={resource.title} />
              ) : (
                <div className="aspect-video w-full rounded-2xl border border-border overflow-hidden select-none bg-slate-100 dark:bg-slate-900">
                  <img src={resource.coverImage} alt={resource.title} className="w-full h-full object-cover" />
                </div>
              )}

              {/* Title & excerpt info */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-2 select-none">
                  <Badge variant="primary" className="text-[10px] py-0.5 uppercase tracking-wide">
                    {resource.category}
                  </Badge>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getDifficultyBadge(resource.difficulty)}`}>
                    {resource.difficulty}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3.5xl font-black text-foreground tracking-tight leading-tight select-text">
                  {resource.title}
                </h1>
                <p className="text-sm sm:text-base text-slate-550 dark:text-slate-400 leading-relaxed font-medium select-text">
                  {resource.description}
                </p>
              </div>

              {/* Dynamic MDX details body description */}
              <div className="border-t border-border/40 pt-6">
                <div className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-350 space-y-5 text-sm sm:text-base leading-relaxed select-text">
                  {mdxContent}
                </div>
              </div>

              {/* Features list */}
              {resource.features && resource.features.length > 0 && (
                <div className="space-y-4 pt-6 border-t border-border/40 select-none">
                  <h3 className="font-extrabold text-sm sm:text-base text-foreground flex items-center gap-2">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                    <span>Key Features</span>
                  </h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-500 leading-relaxed pl-1.5">
                    {resource.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-555 mt-0.5 font-bold">•</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* What's Included */}
              {resource.whatsIncluded && resource.whatsIncluded.length > 0 && (
                <div className="space-y-4 pt-6 border-t border-border/40 select-none">
                  <h3 className="font-extrabold text-sm sm:text-base text-foreground flex items-center gap-2">
                    <FileText className="h-4.5 w-4.5 text-blue-500" />
                    <span>What&apos;s Included</span>
                  </h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-500 leading-relaxed pl-1.5">
                    {resource.whatsIncluded.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* System Requirements */}
              {resource.requirements && resource.requirements.length > 0 && (
                <div className="space-y-4 pt-6 border-t border-border/40 select-none">
                  <h3 className="font-extrabold text-sm sm:text-base text-foreground flex items-center gap-2">
                    <Cpu className="h-4.5 w-4.5 text-primary" />
                    <span>System Requirements</span>
                  </h3>
                  <ul className="space-y-2 text-xs sm:text-sm text-slate-500 leading-relaxed pl-1.5">
                    {resource.requirements.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-primary mt-0.5 font-bold">•</span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Right Sidebar Column */}
            <aside className="lg:col-span-4 space-y-6">
              {/* Product Checkout parameters block */}
              <DownloadCard resource={resource} />

              {/* License security card */}
              <Card className="p-4 bg-card border border-border/80 select-none flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h5 className="font-bold text-[11px] text-foreground uppercase tracking-wide leading-none">Instant Access</h5>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Downloads are made available instantly in your browser or delivered secure via email after order completion.
                  </p>
                </div>
              </Card>
            </aside>
          </div>

          {/* Related Resources Grid list */}
          <div className="border-t border-border/40 pt-16 mt-16 space-y-8 select-none">
            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-black text-foreground">Related Resources</h3>
              <p className="text-xs text-slate-550 dark:text-slate-450">Continue discovering templates, toolkits, and cheatsheets to support your task workflows.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((rec) => (
                <ResourceCard key={rec.id} resource={rec} />
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
  const resourcesList = await getAllResources();
  return resourcesList.map((r) => ({
    slug: r.slug,
  }));
}
