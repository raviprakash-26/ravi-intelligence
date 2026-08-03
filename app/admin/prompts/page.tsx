import { getAllPrompts } from "@/lib/prompts";
import { CmsListClient } from "@/components/admin/cms-list-client";

export default async function AdminPromptsPage() {
  const prompts = await getAllPrompts();
  return <CmsListClient type="prompt" items={prompts} />;
}
