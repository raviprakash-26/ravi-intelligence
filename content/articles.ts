import { Article } from "@/types";

export const articles: Article[] = [
  // --- Article 2 ---
  {
    id: "art-2",
    slug: "how-to-build-data-models", // The URL will be: /blog/how-to-build-data-models
    title: "How to Build Robust Data Analytics Models",
    excerpt: "A practical guide to structuring SQL schemas and Power BI reporting layers for startups.",
    content: `
Writing data models requires clean, partitioned databases. In this guide, we explore why indexing matters...

### 1. Database Indexing
Indexing speeds up your select queries significantly...
`,
    coverImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800",
    category: "Technology",
    tags: ["SQL", "Power BI", "Data Modeling"],
    publishedAt: "2026-08-03",
    author: {
      name: "Ravi Prakash",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150",
      role: "Lead Analytics Architect",
      bio: "Founder of Ravi Intelligence."
    },
    readingTime: 5,
    featured: true,     // Set to 'true' if you want this to show up as the large banner story!
    editorPick: false
  },

  // --- Article 1 ---
  {
    id: "art-1",
    slug: "my-first-analytics-article",
    title: "Welcome to Ravi Intelligence: Unleashing Data Power",
    excerpt: "An introductory guide outlining how we combine business finance analytics with state-of-the-art AI.",
    content: `
Welcome to our very first publication! At Ravi Intelligence, we aim to bridge the gap between financial models and modern artificial intelligence setups.

### What to Expect

We publish deep-dive columns, news reports, and digital downloads covering:
- **SQL & Databases**: Performance indexing, partitioning, and queries.
- **Power BI & Excel**: Executive report dashboard canvases and visual formulas.
- **Generative AI**: Copy-paste Gemini prompts for marketing and code creation.

> [!TIP]
> Bookmark this page to stay updated on our upcoming articles and free template downloads!
`,
    coverImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop",
    category: "AI",
    tags: ["Data", "AI", "Startup"],
    publishedAt: "2026-08-03",
    author: {
      name: "Ravi Prakash",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop",
      role: "Lead Analytics Architect",
      bio: "Ravi Prakash is the founder of Ravi Intelligence, focusing on modern database analytics and prompt engineering systems."
    },
    readingTime: 3,
    featured: false,    // Changed to false so your new post is the featured banner!
    editorPick: true
  }
];
