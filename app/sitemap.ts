import { MetadataRoute } from "next";
import { getAllArticles } from "@/lib/content";
import { getAllResources } from "@/lib/resources";
import { getAllPaths, getLessonsForPath } from "@/lib/learn";
import { getAllPrompts } from "@/lib/prompts";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://ravi-intelligence.com";

  // 1. Core pages list
  const coreUrls = [
    "",
    "/blog",
    "/resources",
    "/learn",
    "/prompts",
    "/prompt-library",
    "/store",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  // 2. Fetch all dynamic slugs
  const [articles, resources, paths, prompts] = await Promise.all([
    getAllArticles(),
    getAllResources(),
    getAllPaths(),
    getAllPrompts(),
  ]);

  const articleUrls = articles.map((art) => ({
    url: `${baseUrl}/blog/${art.slug}`,
    lastModified: art.lastUpdated ? new Date(art.lastUpdated) : new Date(art.publishedAt),
    changeFrequency: "weekly" as const,
    priority: 0.64,
  }));

  const resourceUrls = resources.map((res) => ({
    url: `${baseUrl}/resources/${res.slug}`,
    lastModified: res.updatedAt ? new Date(res.updatedAt) : new Date(res.publishedAt),
    changeFrequency: "weekly" as const,
    priority: 0.64,
  }));

  const pathUrls = paths.map((pathItem) => ({
    url: `${baseUrl}/learn/${pathItem.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.64,
  }));

  // Fetch all lesson dynamic slug parameters
  const lessonsLists = await Promise.all(
    paths.map(async (pathConfig) => {
      const lessons = await getLessonsForPath(pathConfig.slug);
      return lessons.map((l) => ({
        url: `${baseUrl}/learn/${pathConfig.slug}/${l.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.5,
      }));
    })
  );
  const lessonUrls = lessonsLists.flat();

  const promptUrls = prompts.map((pr) => ({
    url: `${baseUrl}/prompts/${pr.slug}`,
    lastModified: pr.updatedAt ? new Date(pr.updatedAt) : new Date(pr.publishedAt),
    changeFrequency: "weekly" as const,
    priority: 0.64,
  }));

  return [
    ...coreUrls,
    ...articleUrls,
    ...resourceUrls,
    ...pathUrls,
    ...lessonUrls,
    ...promptUrls,
  ];
}
