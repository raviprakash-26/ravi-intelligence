import { notFound } from "next/navigation";
import { CmsLayout } from "@/components/admin/cms-layout";
import { CmsEditor } from "@/components/admin/cms-editor";
import { getArticleBySlug, getAllArticles } from "@/lib/content";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  return (
    <CmsLayout>
      <CmsEditor type="article" initialData={article} />
    </CmsLayout>
  );
}

export async function generateStaticParams() {
  const articles = await getAllArticles();
  return articles.map((art) => ({
    slug: art.slug,
  }));
}
