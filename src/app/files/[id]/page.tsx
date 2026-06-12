import Link from "next/link";
import { notFound } from "next/navigation";

import {
  AtlasInfoField,
  AtlasTopbar,
  FileBottomNav,
  formatAtlasDate,
  relationshipShortLabel,
  splitFileTitle,
  workflowReadyLabel,
} from "@/features/files/components/file-ui";
import { addFileNoteAction } from "@/features/files/actions";
import { FileImagesPanel } from "@/features/files/components/file-images-panel";
import { getFileDetail } from "@/features/files/data";
import { requireAuth } from "@/services/auth/session";
import {
  budgetRangeLabels,
  projectTypeLabels,
} from "@/types/atlas";

export const dynamic = "force-dynamic";

export default async function FileDetailPage({
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

  const { file, contact, notes, assets } = detail;
  const title = splitFileTitle(file.title);

  return (
    <main className="atlas-file-app atlas-has-bottom-nav">
      <AtlasTopbar backHref="/files" fileName={title.name} />

      <section className="atlas-detail-view">
        <article className="atlas-file-banner">
          <div>
            <div className="atlas-eyebrow">File</div>
            <h1>{file.title}</h1>
            <p className="atlas-subtle">
              A file stores the people, status, project basics, budget range,
              images, and notes for one opportunity.
            </p>
            <div className="atlas-info-grid">
              <AtlasInfoField
                label="Status"
                value={relationshipShortLabel(file.relationshipStatus)}
              />
              <AtlasInfoField
                label="Lead date"
                value={formatAtlasDate(file.createdAt)}
              />
              <AtlasInfoField
                label="Project type"
                value={projectTypeLabels[file.projectType]}
              />
              <AtlasInfoField
                label="Budget"
                value={budgetRangeLabels[file.budgetRange]}
              />
            </div>
          </div>
          <div className="atlas-ready-orb">
            {workflowReadyLabel(file.workflowStage)}
          </div>
        </article>

        <div className="atlas-file-sections">
          <section className="atlas-simple-panel">
            <div className="atlas-simple-panel-head">
              <div>
                <h2>People</h2>
                <p className="atlas-muted">
                  Basic contact details attached to the file.
                </p>
              </div>
              <Link className="atlas-btn atlas-btn-outline" href={`/files/${id}/edit`}>
                Edit
              </Link>
            </div>
            <div className="atlas-simple-panel-body">
              <div className="atlas-info-stack">
                <AtlasInfoField label="Name" value={contact?.name || "Not set"} />
                <AtlasInfoField label="Email" value={contact?.email || "Not set"} />
                <AtlasInfoField label="Phone" value={contact?.phone || "Not set"} />
              </div>
            </div>
          </section>

          <section className="atlas-simple-panel">
            <div className="atlas-simple-panel-head">
              <div>
                <h2>Project</h2>
                <p className="atlas-muted">
                  The simple file details we know so far.
                </p>
              </div>
            </div>
            <div className="atlas-simple-panel-body">
              <div className="atlas-info-stack">
                <AtlasInfoField
                  label="Project type"
                  value={projectTypeLabels[file.projectType]}
                />
                <AtlasInfoField
                  label="Budget range"
                  value={budgetRangeLabels[file.budgetRange]}
                />
                <AtlasInfoField
                  label="Lead date"
                  value={formatAtlasDate(file.createdAt)}
                />
              </div>
            </div>
          </section>
        </div>

        <FileImagesPanel assets={assets} fileId={id} />

        <section className="atlas-simple-panel mt-4">
          <div className="atlas-simple-panel-head">
            <div>
              <h2>File notes</h2>
              <p className="atlas-muted">No CRM machinery, just the useful context.</p>
            </div>
          </div>
          <div className="atlas-simple-panel-body">
            <form
              action={addFileNoteAction.bind(null, id)}
              className="atlas-note-form"
            >
              <label htmlFor="file-note">Add a note</label>
              <textarea
                id="file-note"
                name="body"
                placeholder="Site visit detail, client preference, next action."
                required
              />
              <button className="atlas-btn atlas-btn-primary" type="submit">
                Add note
              </button>
            </form>

            <div className="atlas-note-list">
              {notes.map((note) => (
                <div className="atlas-note-line" key={note.id}>
                  <span>{note.body}</span>
                  <small>{formatAtlasDate(note.createdAt)}</small>
                </div>
              ))}
              <div className="atlas-note-line">
                <span>
                  Use the Pipelines page when you want to generate images, create
                  documents, or run other file actions.
                </span>
              </div>
            </div>
          </div>
        </section>
      </section>

      <FileBottomNav active="details" fileId={id} />
    </main>
  );
}
