"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  TrendingUp,
  Database,
  Terminal,
  Sparkles,
  Users,
  Layout,
  FileSpreadsheet
} from "lucide-react";
import { AnnouncementBar, Navbar, Footer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArticleCard,
  NewsCard,
  ResourceCard,
  ProductCard,
  PromptCard
} from "@/components/common/cards";
import { OrganizationSchema } from "@/components/common/seo";
import { MdxArticle, NewsItem, Product, Resource, PromptItem } from "@/types";

interface HomeClientProps {
  articles: MdxArticle[];
  news: NewsItem[];
  products: Product[];
  resources: Resource[];
  prompts: PromptItem[];
}

export function HomeClient({ articles, news, products, resources, prompts }: HomeClientProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  const featuredCats = [
    { label: "Excel Analytics", desc: "Formulas, macros, & models", icon: FileSpreadsheet, color: "text-green-500 bg-green-500/10 border-green-500/20" },
    { label: "Power BI Reporting", desc: "DAX pipelines & dashboards", icon: Layout, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
    { label: "SQL Databases", desc: "Window queries & partitioning", icon: Database, color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
    { label: "Python Basics", desc: "Automation & data scraping", icon: Terminal, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
    { label: "Prompt Engineering", desc: "Gemini and Claude orchestration", icon: Sparkles, color: "text-purple-500 bg-purple-500/10 border-purple-500/20" },
    { label: "Corporate Finance", desc: "EBITDA, budgeting & modeling", icon: TrendingUp, color: "text-rose-500 bg-rose-500/10 border-rose-500/20" }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <OrganizationSchema />
      <AnnouncementBar />
      <Navbar />

      <main className="flex-grow">
        {/* ==================== 1. HERO SECTION ==================== */}
        <section className="relative overflow-hidden py-20 lg:py-28 px-4 sm:px-6 lg:px-8 border-b border-border bg-gradient-to-b from-blue-500/5 via-transparent to-transparent">
          <div className="max-w-7xl mx-auto text-center space-y-8 relative z-10 select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>India&apos;s Premium Learning Hub</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight"
            >
              Learn. Analyze. Grow. <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent">
                Master Data, Finance, and AI.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base sm:text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed"
            >
              Acquire job-ready skills in Excel, SQL, Python, Power BI, Accounting, and Prompt Engineering. Access premium tutorials, technology news, and professional digital resources.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/prompt-library" className="w-full sm:w-auto">
                <Button variant="primary" className="w-full sm:w-auto font-bold h-12 text-sm">
                  Browse Prompt Library
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </Link>
              <Link href="/store" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto font-bold h-12 text-sm bg-card border-border">
                  Visit Digital Store
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Decorative backdrop shapes */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10" />
          <div className="absolute top-1/3 left-1/3 w-[300px] h-[200px] bg-secondary/10 rounded-full blur-[100px] pointer-events-none -z-10" />
        </section>

        {/* ==================== 2. FEATURED CATEGORIES ==================== */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-border/40 select-none">
          <div className="text-center space-y-2 mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              What do you want to learn today?
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Browse structured courses and resources mapped to premium industry standards.
            </p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {featuredCats.map((cat) => {
              const Icon = cat.icon;
              return (
                <motion.div key={cat.label} variants={itemVariants}>
                  <Card hoverEffect className="p-5 flex items-start gap-4 bg-card h-full">
                    <div className={`p-3 rounded-lg border shrink-0 ${cat.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-base text-foreground leading-tight">{cat.label}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">{cat.desc}</p>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </section>

        {/* ==================== 3. FEATURED ARTICLES ==================== */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-border/40">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10 select-none">
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Featured Editorial
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Deep analytical articles written by industry experts.
              </p>
            </div>
            <Link href="/blog" className="text-primary hover:text-blue-700 text-sm font-semibold inline-flex items-center gap-0.5 group">
              View All Articles
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {articles.slice(0, 2).map((art) => (
              <ArticleCard key={art.id} article={art} />
            ))}
          </div>
        </section>

        {/* ==================== 4. TRENDING NEWS ==================== */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-border/40 bg-slate-50/50 dark:bg-transparent">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10 select-none">
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Latest Technology & Business News
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Keep up with AI revolutions, business, Indian politics, and cinema events.
              </p>
            </div>
            <Link href="/news" className="text-primary hover:text-blue-700 text-sm font-semibold inline-flex items-center gap-0.5 group">
              Open Newsroom
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {news.slice(0, 3).map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        </section>

        {/* ==================== 6. PROMPT LIBRARY PREVIEW ==================== */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-border/40">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10 select-none">
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Gemini Prompt Library Preview
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Unlock generative AI in your workflow with custom copy-paste prompts.
              </p>
            </div>
            <Link href="/prompt-library" className="text-primary hover:text-blue-700 text-sm font-semibold inline-flex items-center gap-0.5 group">
              Explore All Prompts
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {prompts.slice(0, 3).map((item) => (
              <PromptCard key={item.id} item={item} />
            ))}
          </div>
        </section>

        {/* ==================== 7. DIGITAL STORE & FREE RESOURCES ==================== */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-border/40 bg-slate-50/50 dark:bg-transparent">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10 select-none">
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Premium Store & Downloads
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Acquire spreadsheets, database files, and cheatsheets to jumpstart analytics tasks.
              </p>
            </div>
            <Link href="/store" className="text-primary hover:text-blue-700 text-sm font-semibold inline-flex items-center gap-0.5 group">
              Browse Digital Store
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Show two products and two resources side-by-side */}
            {products.slice(0, 2).map((prod) => (
              <ProductCard key={prod.id} product={prod} onBuy={(p) => alert(`Mock purchase triggered for ${p.title}`)} />
            ))}
            {resources.slice(0, 2).map((res) => (
              <ResourceCard key={res.id} resource={res} onDownload={() => alert(`Downloading free asset: ${res.title}`)} />
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
