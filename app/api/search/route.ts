import { NextResponse } from "next/server";
import { getAllArticles } from "@/lib/content";
import { getAllResources } from "@/lib/resources";
import { getAllPaths } from "@/lib/learn";
import { getAllPrompts } from "@/lib/prompts";

export async function GET() {
  try {
    const [articles, resources, paths, prompts] = await Promise.all([
      getAllArticles(),
      getAllResources(),
      getAllPaths(),
      getAllPrompts(),
    ]);

    const searchIndex: any[] = [];

    // Map articles
    articles.forEach((art) => {
      searchIndex.push({
        title: art.title,
        description: art.excerpt || "",
        url: `/blog/${art.slug}`,
        type: "Article",
        category: art.category,
      });
    });

    // Map resources
    resources.forEach((res) => {
      searchIndex.push({
        title: res.title,
        description: res.description,
        url: `/resources/${res.slug}`,
        type: "Resource",
        category: res.category,
      });
    });

    // Map learning paths
    paths.forEach((pathItem) => {
      searchIndex.push({
        title: pathItem.title,
        description: pathItem.description,
        url: `/learn/${pathItem.slug}`,
        type: "Learning Path",
        category: pathItem.category,
      });
    });

    // Map prompts
    prompts.forEach((pr) => {
      searchIndex.push({
        title: pr.title,
        description: pr.description,
        url: `/prompts/${pr.slug}`,
        type: "AI Prompt",
        category: pr.category,
      });
    });

    return NextResponse.json(searchIndex);
  } catch (error) {
    return NextResponse.json({ error: "Failed to compile search index" }, { status: 500 });
  }
}
