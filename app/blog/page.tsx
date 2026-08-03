import { getAllArticles } from "@/lib/content";
import { BlogClient } from "@/components/blog/blog-client";

export default async function BlogIndexPage() {
  const articlesList = await getAllArticles();
  return <BlogClient articles={articlesList} />;
}
