import { notFound } from "next/navigation";
import { CmsLayout } from "@/components/admin/cms-layout";
import { CmsEditor } from "@/components/admin/cms-editor";
import { getResourceBySlug, getAllResources } from "@/lib/resources";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditResourcePage({ params }: PageProps) {
  const { slug } = await params;
  const resource = await getResourceBySlug(slug);

  if (!resource) {
    notFound();
  }

  return (
    <CmsLayout>
      <CmsEditor type="resource" initialData={resource} />
    </CmsLayout>
  );
}

export async function generateStaticParams() {
  const resources = await getAllResources();
  return resources.map((res) => ({
    slug: res.slug,
  }));
}
