import { getAllPaths } from "@/lib/learn";
import { LearnClient } from "@/components/learn/learn-client";

export default async function LearnPage() {
  const paths = await getAllPaths();
  return <LearnClient initialPaths={paths} />;
}
