import { AppShell } from "@/components/app-shell";
import { createFileAction } from "@/features/files/actions";
import { FileForm } from "@/features/files/components/file-form";
import { requireAuth } from "@/services/auth/session";

export const dynamic = "force-dynamic";

export default async function NewFilePage() {
  await requireAuth();

  return (
    <AppShell title="New file" eyebrow="Create" backHref="/files">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-normal">New file</h1>
        <p className="text-sm text-muted-foreground">
          Create the file before any pipeline runs.
        </p>
      </div>
      <FileForm
        action={createFileAction}
        submitLabel="Create file"
        cancelHref="/files"
      />
    </AppShell>
  );
}
