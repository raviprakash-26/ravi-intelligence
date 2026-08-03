import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { PromptItem } from "@/types";

const promptsDirectory = path.join(process.cwd(), "content/prompts");

export async function getAllPrompts(): Promise<PromptItem[]> {
  if (!fs.existsSync(promptsDirectory)) {
    fs.mkdirSync(promptsDirectory, { recursive: true });
  }

  // Recursive reader helper
  const getFilesRecursively = (dir: string): string[] => {
    let files: string[] = [];
    if (!fs.existsSync(dir)) return [];
    
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        files = files.concat(getFilesRecursively(filePath));
      } else if (file.endsWith(".mdx") || file.endsWith(".md")) {
        files.push(filePath);
      }
    });
    return files;
  };

  const files = getFilesRecursively(promptsDirectory);

  const promptsList = files.map((filePath) => {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(fileContent);

    return {
      id: data.id || path.basename(filePath, path.extname(filePath)),
      title: data.title || "Untitled Prompt",
      slug: data.slug || path.basename(filePath, path.extname(filePath)),
      platform: data.platform || "ChatGPT",
      category: data.category || "General",
      description: data.excerpt || data.description || "",
      prompt: data.prompt || "",
      variables: data.variables || [],
      exampleInput: data.exampleInput || "",
      exampleOutput: data.exampleOutput || "",
      difficulty: data.difficulty || "Beginner",
      tags: data.tags || [],
      author: data.author || "Ravi Prakash",
      publishedAt: data.publishedAt ? String(data.publishedAt) : new Date().toISOString().split("T")[0],
      updatedAt: data.updatedAt ? String(data.updatedAt) : new Date().toISOString().split("T")[0],
      featured: data.featured === true,
      free: data.free !== false,
      price: data.price ? Number(data.price) : undefined,
      content: content,
    } as PromptItem;
  });

  return promptsList.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function getPromptBySlug(slug: string): Promise<PromptItem | null> {
  const promptsList = await getAllPrompts();
  return promptsList.find((p) => p.slug === slug) || null;
}
