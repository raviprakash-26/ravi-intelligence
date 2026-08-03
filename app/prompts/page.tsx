import { getAllPrompts } from "@/lib/prompts";
import { PromptsClient } from "@/components/prompts/prompts-client";

export default async function PromptsIndexPage() {
  const prompts = await getAllPrompts();
  return <PromptsClient initialPrompts={prompts} />;
}
