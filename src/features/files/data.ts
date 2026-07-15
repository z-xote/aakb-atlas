import { randomUUID } from "node:crypto";

import { and, desc, eq } from "drizzle-orm";

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
import { parseAssetTags } from "@/features/files/schemas";
import { ApiError } from "@/services/api/response";
import { uploadStoredObject } from "@/services/bunny/client";
import type {
  ClockPosition,
  FileAssetOrigin,
  FileAssetStatus,
  FileFormInput,
  FileImageKind,
} from "@/types/atlas";

export type FileListItem = {
  file: FileRow;
  contact: PrimaryContactRow | null;
};

export type FileDetail = FileListItem & {
  notes: FileNoteRow[];
  assets: FileAssetRow[];
  runs: PipelineRunRow[];
};

export type FileAssetDto = Omit<FileAssetRow, "tagsJson"> & { tags: string[] };

export function toFileAssetDto(asset: FileAssetRow): FileAssetDto {
  const { tagsJson, ...rest } = asset;
  return { ...rest, tags: parseAssetTags(tagsJson) };
}

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
        status: "ready",
        origin: "upload",
        contentType: "image/unknown",
        sizeBytes: 0,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    tx.update(files).set({ updatedAt: now }).where(eq(files.id, id)).run();
  });

  await persistDatabase();
}

export async function getFileAsset(fileId: string, assetId: string) {
  const db = await getDb();
  return db
    .select()
    .from(fileAssets)
    .where(and(eq(fileAssets.id, assetId), eq(fileAssets.fileId, fileId)))
    .get() ?? null;
}

type AssetMetadataInput = {
  label: string;
  room: string | null;
  tags: string[];
  cameraPositionClock: ClockPosition | null;
};

async function reserveFileAsset(
  fileId: string,
  input: AssetMetadataInput & {
    origin: FileAssetOrigin;
    kind?: FileImageKind;
    contentType: string;
    sizeBytes: number;
    retryAssetId?: string | null;
  }
) {
  const db = await getDb();
  const file = db.select({ id: files.id }).from(files).where(eq(files.id, fileId)).get();
  if (!file) throw new ApiError(404, "file_not_found", "That file no longer exists.");

  const now = Date.now();
  const values = {
    kind: input.kind ?? "site_visit",
    status: "pending" as const,
    origin: input.origin,
    label: input.label,
    url: "",
    storageKey: "",
    contentType: input.contentType,
    sizeBytes: input.sizeBytes,
    room: input.room,
    tagsJson: JSON.stringify(input.tags),
    cameraPositionClock: input.cameraPositionClock,
    capturedAt: now,
    errorMessage: null,
    updatedAt: now,
  };

  if (input.retryAssetId) {
    const existing = await getFileAsset(fileId, input.retryAssetId);
    if (!existing) {
      throw new ApiError(404, "asset_not_found", "That image does not belong to this file.");
    }
    if (existing.status === "ready") {
      throw new ApiError(409, "asset_already_ready", "That image has already uploaded.");
    }
    db.update(fileAssets).set(values).where(eq(fileAssets.id, existing.id)).run();
    await persistDatabase();
    return { ...existing, ...values } satisfies FileAssetRow;
  }

  const asset = {
    id: `asset_${randomUUID()}`,
    fileId,
    ...values,
    createdAt: now,
  } satisfies FileAssetRow;
  db.insert(fileAssets).values(asset).run();
  await persistDatabase();
  return asset;
}

async function setFileAssetStatus(
  fileId: string,
  assetId: string,
  input: {
    status: FileAssetStatus;
    url?: string;
    storageKey?: string;
    errorMessage?: string | null;
  }
) {
  const db = await getDb();
  db.update(fileAssets)
    .set({ ...input, updatedAt: Date.now() })
    .where(and(eq(fileAssets.id, assetId), eq(fileAssets.fileId, fileId)))
    .run();
  await persistDatabase();
  const asset = await getFileAsset(fileId, assetId);
  if (!asset) throw new ApiError(404, "asset_not_found", "That image does not belong to this file.");
  return asset;
}

function fileExtension(filename: string, contentType: string) {
  const fromName = filename.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  if (fromName && fromName.length <= 8) return fromName;
  return ({
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "heic",
    "image/heif": "heif",
  } as Record<string, string>)[contentType] ?? "img";
}

export async function uploadFileAsset(
  input: AssetMetadataInput & {
    fileId: string;
    origin: FileAssetOrigin;
    kind?: FileImageKind;
    filename: string;
    contentType: string;
    bytes: Uint8Array;
    retryAssetId?: string | null;
  },
  storeObject = uploadStoredObject
) {
  const asset = await reserveFileAsset(input.fileId, {
    ...input,
    sizeBytes: input.bytes.byteLength,
  });

  try {
    const stored = await storeObject({
      objectPath: `files/${input.fileId}/assets/${asset.id}.${fileExtension(input.filename, input.contentType)}`,
      bytes: input.bytes,
      contentType: input.contentType,
    });
    const ready = await setFileAssetStatus(input.fileId, asset.id, {
      status: "ready",
      url: stored.publicUrl,
      storageKey: stored.storageKey,
      errorMessage: null,
    });
    return toFileAssetDto(ready);
  } catch (error) {
    const storageError = error instanceof ApiError ? error : null;
    const notConfigured = storageError?.code === "bunny_not_configured";
    await setFileAssetStatus(input.fileId, asset.id, {
      status: "failed",
      errorMessage: notConfigured
        ? storageError.message
        : "Upload failed. Check storage and try again.",
    });
    throw new ApiError(notConfigured ? 503 : 502, "asset_upload_failed", notConfigured
      ? storageError.message
      : "Bunny did not accept this image. You can retry it.", {
      assetId: asset.id,
      retryable: !notConfigured,
      ...(storageError ? { causeCode: storageError.code, causeDetails: storageError.details } : {}),
    });
  }
}

export async function updateFileAssetMetadata(
  fileId: string,
  assetId: string,
  input: AssetMetadataInput
) {
  const asset = await getFileAsset(fileId, assetId);
  if (!asset) throw new ApiError(404, "asset_not_found", "That image does not belong to this file.");
  const db = await getDb();
  db.update(fileAssets)
    .set({
      label: input.label,
      room: input.room,
      tagsJson: JSON.stringify(input.tags),
      cameraPositionClock: input.cameraPositionClock,
      updatedAt: Date.now(),
    })
    .where(and(eq(fileAssets.id, assetId), eq(fileAssets.fileId, fileId)))
    .run();
  await persistDatabase();
  return toFileAssetDto((await getFileAsset(fileId, assetId))!);
}

export async function deleteFile(id: string) {
  const db = await getDb();

  db.delete(files).where(eq(files.id, id)).run();
  await persistDatabase();
}
