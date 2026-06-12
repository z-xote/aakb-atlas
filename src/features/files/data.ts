import { randomUUID } from "node:crypto";

import { desc, eq } from "drizzle-orm";

import { getDb, persistDatabase } from "@/db/client";
import {
  fileAssets,
  fileNotes,
  files,
  pipelineRuns,
  primaryContacts,
  type FileAssetRow,
  type FileNoteRow,
  type FileRow,
  type PipelineRunRow,
  type PrimaryContactRow,
} from "@/db/schema";
import type { FileFormInput, FileImageKind } from "@/types/atlas";

export type FileListItem = {
  file: FileRow;
  contact: PrimaryContactRow | null;
};

export type FileDetail = FileListItem & {
  notes: FileNoteRow[];
  assets: FileAssetRow[];
  runs: PipelineRunRow[];
};

export async function listFiles(): Promise<FileListItem[]> {
  const db = await getDb();

  return db
    .select({
      file: files,
      contact: primaryContacts,
    })
    .from(files)
    .leftJoin(primaryContacts, eq(primaryContacts.fileId, files.id))
    .orderBy(desc(files.updatedAt))
    .all();
}

export async function getFileDetail(id: string): Promise<FileDetail | null> {
  const db = await getDb();
  const row = db
    .select({
      file: files,
      contact: primaryContacts,
    })
    .from(files)
    .leftJoin(primaryContacts, eq(primaryContacts.fileId, files.id))
    .where(eq(files.id, id))
    .get();

  if (!row) {
    return null;
  }

  return {
    ...row,
    notes: db
      .select()
      .from(fileNotes)
      .where(eq(fileNotes.fileId, id))
      .orderBy(desc(fileNotes.createdAt))
      .all(),
    assets: db
      .select()
      .from(fileAssets)
      .where(eq(fileAssets.fileId, id))
      .orderBy(desc(fileAssets.createdAt))
      .all(),
    runs: db
      .select()
      .from(pipelineRuns)
      .where(eq(pipelineRuns.fileId, id))
      .orderBy(desc(pipelineRuns.createdAt))
      .all(),
  };
}

export async function createFile(input: FileFormInput) {
  const db = await getDb();
  const now = Date.now();
  const fileId = `file_${randomUUID()}`;
  const contactId = `contact_${randomUUID()}`;

  db.transaction((tx) => {
    tx.insert(files)
      .values({
        id: fileId,
        title: input.title,
        relationshipStatus: input.relationshipStatus,
        workflowStage: input.workflowStage,
        projectType: input.projectType,
        budgetRange: input.budgetRange,
        jobType: input.jobType,
        leadSource: input.leadSource,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    tx.insert(primaryContacts)
      .values({
        id: contactId,
        fileId,
        name: input.contactName,
        email: input.contactEmail,
        phone: input.contactPhone,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    if (input.note) {
      tx.insert(fileNotes)
        .values({
          id: `note_${randomUUID()}`,
          fileId,
          body: input.note,
          createdAt: now,
        })
        .run();
    }

    tx.insert(fileAssets)
      .values({
        id: `asset_${randomUUID()}`,
        fileId,
        kind: "before_photo",
        label: "Before photo slot",
        url: "",
        storageKey: `files/${fileId}/assets/before-photo.jpg`,
        createdAt: now,
      })
      .run();

    tx.insert(pipelineRuns)
      .values({
        id: `run_${randomUUID()}`,
        fileId,
        pipelineKey: "atlas_image",
        status: "placeholder",
        summary: "Atlas Image shell is staged. Real generation is deferred.",
        createdAt: now,
        finishedAt: null,
      })
      .run();
  });

  await persistDatabase();

  return fileId;
}

export async function updateFile(id: string, input: FileFormInput) {
  const db = await getDb();
  const now = Date.now();

  db.transaction((tx) => {
    tx.update(files)
      .set({
        title: input.title,
        relationshipStatus: input.relationshipStatus,
        workflowStage: input.workflowStage,
        projectType: input.projectType,
        budgetRange: input.budgetRange,
        jobType: input.jobType,
        leadSource: input.leadSource,
        updatedAt: now,
      })
      .where(eq(files.id, id))
      .run();

    const contact = tx
      .select({ id: primaryContacts.id })
      .from(primaryContacts)
      .where(eq(primaryContacts.fileId, id))
      .get();

    if (contact) {
      tx.update(primaryContacts)
        .set({
          name: input.contactName,
          email: input.contactEmail,
          phone: input.contactPhone,
          updatedAt: now,
        })
        .where(eq(primaryContacts.id, contact.id))
        .run();
    } else {
      tx.insert(primaryContacts)
        .values({
          id: `contact_${randomUUID()}`,
          fileId: id,
          name: input.contactName,
          email: input.contactEmail,
          phone: input.contactPhone,
          createdAt: now,
          updatedAt: now,
        })
        .run();
    }

    if (input.note) {
      tx.insert(fileNotes)
        .values({
          id: `note_${randomUUID()}`,
          fileId: id,
          body: input.note,
          createdAt: now,
        })
        .run();
    }
  });

  await persistDatabase();
}

export async function appendFileNote(id: string, body: string) {
  const db = await getDb();
  const now = Date.now();

  db.transaction((tx) => {
    tx.insert(fileNotes)
      .values({
        id: `note_${randomUUID()}`,
        fileId: id,
        body,
        createdAt: now,
      })
      .run();

    tx.update(files).set({ updatedAt: now }).where(eq(files.id, id)).run();
  });

  await persistDatabase();
}

export async function addFileAsset(
  id: string,
  input: {
    kind: FileImageKind;
    label: string;
    url: string;
    storageKey: string;
  }
) {
  const db = await getDb();
  const now = Date.now();

  db.transaction((tx) => {
    tx.insert(fileAssets)
      .values({
        id: `asset_${randomUUID()}`,
        fileId: id,
        kind: input.kind,
        label: input.label,
        url: input.url,
        storageKey: input.storageKey,
        createdAt: now,
      })
      .run();

    tx.update(files).set({ updatedAt: now }).where(eq(files.id, id)).run();
  });

  await persistDatabase();
}

export async function deleteFile(id: string) {
  const db = await getDb();

  db.delete(files).where(eq(files.id, id)).run();
  await persistDatabase();
}
