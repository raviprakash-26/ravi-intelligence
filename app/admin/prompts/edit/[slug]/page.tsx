import { notFound } from "next/navigation";
import { CmsLayout } from "@/components/admin/cms-layout";
import { CmsEditor } from "@/components/admin/cms-editor";
import { getPromptBySlug, getAllPrompts } from "@/lib/prompts";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditPromptPage({ params }: PageProps) {
  const { slug } = await params;
  const prompt = await getPromptBySlug(slug);

  if (!prompt) {
    notFound();
  }

  return (
    <CmsLayout>
      <CmsEditor type="prompt" initialData={prompt} />
    </CmsLayout>
  );
}

export async function generateStaticParams() {
  const prompts = await getAllPrompts();
  return prompts.map((pr) => ({
    slug: pr.slug,
  }));
}
