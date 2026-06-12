import { AtlasTopbar } from "@/features/files/components/file-ui";
import { FilesBoard } from "@/features/files/components/files-board";
import { listFiles } from "@/features/files/data";
import { requireAuth } from "@/services/auth/session";

export const dynamic = "force-dynamic";

export default async function FilesPage() {
  await requireAuth();
  const fileRows = await listFiles();
  const files = fileRows.map(({ file, contact }) => ({
    id: file.id,
    title: file.title,
    contactName: contact?.name ?? null,
    relationshipStatus: file.relationshipStatus,
    workflowStage: file.workflowStage,
    projectType: file.projectType,
    budgetRange: file.budgetRange,
    createdAt: file.createdAt,
  }));

  return (
    <main className="atlas-file-app">
      <AtlasTopbar />

      <section className="atlas-files-view">
        <div className="atlas-files-heading">
          <div className="atlas-heading">
            <div className="atlas-eyebrow">Files</div>
            <h1>Open a file</h1>
            <p className="atlas-subtle">
              Create a file, store project images, then run pipelines inside that file.
            </p>
          </div>
        </div>

        <FilesBoard items={files} />
      </section>
    </main>
  );
}
