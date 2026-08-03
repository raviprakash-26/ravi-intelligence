import { CmsLayout } from "@/components/admin/cms-layout";
import { CmsEditor } from "@/components/admin/cms-editor";

export default function NewArticlePage() {
  return (
    <CmsLayout>
      <CmsEditor type="article" />
    </CmsLayout>
  );
}
