import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";
import { MdxArticle, Author } from "@/types";

const articlesDirectory = path.join(process.cwd(), "content/articles");
const authorsDirectory = path.join(process.cwd(), "content/authors");

const defaultAuthor: Author = {
  id: "ravi-prakash",
  name: "Ravi Prakash",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop",
  role: "Lead Analytics Architect",
  bio: "Founder of Ravi Intelligence."
};

// Helper to recursively find all MDX files in a directory
function getFilesRecursively(dir: string): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) {
    return [];
  }
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFilesRecursively(filePath));
    } else if (file.endsWith(".mdx") || file.endsWith(".md")) {
      results.push(filePath);
    }
  });
  return results;
}

// Helper to fetch full author details from content/authors/
function getAuthorByName(name: string): Author {
  if (!fs.existsSync(authorsDirectory)) {
    return { ...defaultAuthor, name };
  }

  try {
    const files = fs.readdirSync(authorsDirectory);
    for (const file of files) {
      if (file.endsWith(".json")) {
        const filePath = path.join(authorsDirectory, file);
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const author = JSON.parse(fileContent) as Author;
        if (author.name.toLowerCase() === name.toLowerCase()) {
          return author;
        }
      }
    }
  } catch (err) {
    // Fail-safe fallback if directory reading or parsing errors out
  }

  return { ...defaultAuthor, name };
}

// 1. Calculate Reading Time
export function calculateReadingTime(text: string): number {
  const stats = readingTime(text);
  return Math.ceil(stats.minutes);
}

// 2. Get All Articles
export async function getAllArticles(): Promise<MdxArticle[]> {
  if (!fs.existsSync(articlesDirectory)) {
    return [];
  }

  const files = getFilesRecursively(articlesDirectory);
  const articlesList = files.map((filePath) => {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(fileContent);

    // Calculate reading time dynamically
    const readTime = calculateReadingTime(content);

    // Load full author object dynamically
    const authorObj = getAuthorByName(data.author || "Ravi Prakash");

    return {
      id: data.id || path.basename(filePath, path.extname(filePath)),
      slug: data.slug || path.basename(filePath, path.extname(filePath)),
      title: data.title || "Untitled",
      excerpt: data.excerpt || "",
      content: content,
      coverImage: data.cover || "/images/placeholder.webp",
      category: data.category || "General",
      tags: data.tags || [],
      publishedAt: data.publishedAt
        ? (data.publishedAt instanceof Date
            ? data.publishedAt.toISOString().split("T")[0]
            : String(data.publishedAt))
        : new Date().toISOString().split("T")[0],
      author: authorObj,
      readingTime: data.readingTime || readTime,
      featured: data.featured === true || data.featured === "true",
      editorPick: data.editorPick === true || data.editorPick === "true",
    } as MdxArticle;
  });

  // Sort by publishedAt date descending
  return articlesList.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

// 3. Get Article By Slug
export async function getArticleBySlug(slug: string): Promise<MdxArticle | null> {
  const articlesList = await getAllArticles();
  return articlesList.find((a) => a.slug === slug) || null;
}

// 4. Get Articles By Category
export async function getArticlesByCategory(category: string): Promise<MdxArticle[]> {
  const articlesList = await getAllArticles();
  return articlesList.filter((a) => a.category.toLowerCase() === category.toLowerCase());
}

// 5. Get Featured Articles
export async function getFeaturedArticles(): Promise<MdxArticle[]> {
  const articlesList = await getAllArticles();
  return articlesList.filter((a) => a.featured);
}

// 6. Get Latest Articles
export async function getLatestArticles(limit?: number): Promise<MdxArticle[]> {
  const articlesList = await getAllArticles();
  return limit ? articlesList.slice(0, limit) : articlesList;
}
