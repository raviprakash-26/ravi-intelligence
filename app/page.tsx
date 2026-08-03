import { getAllArticles } from "@/lib/content";
import { HomeClient } from "@/components/home/home-client";
import { news } from "@/content/news";
import { products } from "@/content/products";
import { resources } from "@/content/resources";
import { prompts } from "@/content/prompts";

export default async function HomePage() {
  const articlesList = await getAllArticles();

  return (
    <HomeClient
      articles={articlesList}
      news={news}
      products={products}
      resources={resources}
      prompts={prompts}
    />
  );
}
