import { getAllResources } from "@/lib/resources";
import { ResourcesClient } from "@/components/resources/resources-client";

// Opt out of server caching during development if needed, but statically prerender for production
export default async function ResourcesPage() {
  const resourcesList = await getAllResources();
  return <ResourcesClient initialResources={resourcesList} />;
}
