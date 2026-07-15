import { createFileAction } from "@/features/files/actions";
import { FileWizard } from "@/features/files/components/file-wizard";
import { AtlasTopbar } from "@/features/files/components/file-ui";
import { requireAuth } from "@/services/auth/session";

export const dynamic = "force-dynamic";

export default async function NewFilePage() {
  await requireAuth();
  return (
    <main className="atlas-file-app">
      <AtlasTopbar backHref="/files" current="New file" />
      <FileWizard action={createFileAction} />
    </main>
  );
}
