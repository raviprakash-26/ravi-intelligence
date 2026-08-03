import { getAllArticles } from "@/lib/content";
import { CmsListClient } from "@/components/admin/cms-list-client";

export default async function AdminArticlesPage() {
  const articles = await getAllArticles();
  return <CmsListClient type="article" items={articles} />;
}
