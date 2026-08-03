import { getAllResources } from "@/lib/resources";
import { CmsListClient } from "@/components/admin/cms-list-client";

export default async function AdminResourcesPage() {
  const resources = await getAllResources();
  return <CmsListClient type="resource" items={resources} />;
}
