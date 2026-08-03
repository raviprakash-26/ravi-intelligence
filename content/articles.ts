import { Article } from "@/types";

export const articles: Article[] = [
  {
    id: "art-1",
    slug: "my-first-analytics-article", // This becomes the URL: /blog/my-first-analytics-article
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
    coverImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop", // Image link
    category: "AI", // Category tag
    tags: ["Data", "AI", "Startup"], // Keywords
    publishedAt: "2026-08-03",
    author: {
      name: "Ravi Prakash",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop",
      role: "Lead Analytics Architect",
      bio: "Ravi Prakash is the founder of Ravi Intelligence, focusing on modern database analytics and prompt engineering systems."
    },
    readingTime: 3, // In minutes
    featured: true, // Set to true to show this as the large banner at the top of the blog!
    editorPick: true, // Shows in the "Editor's Picks" sidebar
  }
];
