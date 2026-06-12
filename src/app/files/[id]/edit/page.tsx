import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { updateFileAction } from "@/features/files/actions";
import { FileForm } from "@/features/files/components/file-form";
import { getFileDetail } from "@/features/files/data";
import { requireAuth } from "@/services/auth/session";

export const dynamic = "force-dynamic";

export default async function EditFilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;
  const detail = await getFileDetail(id);

  if (!detail) {
    notFound();
  }

  return (
    <AppShell title={detail.file.title} eyebrow="Edit" backHref={`/files/${id}`}>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-normal">Edit file</h1>
        <p className="text-sm text-muted-foreground">
          Changes write back to SQLite.
        </p>
      </div>
      <FileForm
        action={updateFileAction.bind(null, id)}
        submitLabel="Save changes"
        cancelHref={`/files/${id}`}
        detail={detail}
      />
    </AppShell>
  );
}
