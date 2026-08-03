import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { ResourceItem } from "@/types";

// Root directory for resources
const resourcesDirectory = path.join(process.cwd(), "content/resources");

export async function getAllResources(): Promise<ResourceItem[]> {
  if (!fs.existsSync(resourcesDirectory)) {
    fs.mkdirSync(resourcesDirectory, { recursive: true });
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

  const files = getFilesRecursively(resourcesDirectory);

  const resourcesList = files.map((filePath) => {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(fileContent);

    return {
      id: data.id || path.basename(filePath, path.extname(filePath)),
      title: data.title || "Untitled Resource",
      slug: data.slug || path.basename(filePath, path.extname(filePath)),
      description: data.excerpt || data.description || "",
      content: content,
      coverImage: data.cover || "/images/placeholder.webp",
      category: data.category || "General",
      tags: data.tags || [],
      author: data.author || "Ravi Prakash",
      publishedAt: data.publishedAt ? String(data.publishedAt) : new Date().toISOString().split("T")[0],
      updatedAt: data.updatedAt ? String(data.updatedAt) : new Date().toISOString().split("T")[0],
      difficulty: data.difficulty || "Beginner",
      free: data.free !== false, // Default to free if not explicitly false
      price: Number(data.price) || 0,
      fileSize: data.fileSize || "Unknown Size",
      fileType: data.fileType || "ZIP",
      version: data.version || "1.0.0",
      downloadsCount: Number(data.downloadsCount) || 0,
      previewImages: data.previewImages || [],
      features: data.features || [],
      whatsIncluded: data.whatsIncluded || [],
      requirements: data.requirements || [],
    } as ResourceItem;
  });

  // Sort by published date descending
  return resourcesList.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function getResourceBySlug(slug: string): Promise<ResourceItem | null> {
  const resourcesList = await getAllResources();
  return resourcesList.find((r) => r.slug === slug) || null;
}
