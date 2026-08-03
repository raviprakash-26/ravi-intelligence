import { CmsLayout } from "@/components/admin/cms-layout";
import { CmsEditor } from "@/components/admin/cms-editor";

export default function NewPromptPage() {
  return (
    <CmsLayout>
      <CmsEditor type="prompt" />
    </CmsLayout>
  );
}
