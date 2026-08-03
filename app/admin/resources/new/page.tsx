import { CmsLayout } from "@/components/admin/cms-layout";
import { CmsEditor } from "@/components/admin/cms-editor";

export default function NewResourcePage() {
  return (
    <CmsLayout>
      <CmsEditor type="resource" />
    </CmsLayout>
  );
}
