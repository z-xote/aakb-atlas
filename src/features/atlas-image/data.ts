import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, inArray } from "drizzle-orm";

import { getDb, persistDatabase } from "@/db/client";
import {
  atlasImageDirections,
  atlasImageGenerations,
  atlasImageSessionReferences,
  atlasImageSessions,
  referenceImages,
  type AtlasImageGenerationRow,
} from "@/db/schema";
import { getFileAsset, toFileAssetDto, uploadFileAsset } from "@/features/files/data";
import {
  ensureReferenceCategory,
  listReferenceCatalog,
  uploadReferenceImage,
  type ReferenceDto,
  type ReferenceObjectWriter,
} from "@/features/references/data";
import { ApiError } from "@/services/api/response";
import {
  AtlasProviderError,
  openAIAtlasProvider,
  type AtlasImageEditInput,
  type AtlasImageEditResult,
  type ProviderImageInput,
} from "@/services/openai/client";
import { getOpenAIEnv } from "@/services/openai/env";
import type {
  AtlasImageGenerationStatus,
  AtlasImageQuality,
} from "@/types/atlas";

export type DirectionSnapshot = { id: string; position: number; body: string; createdAt: number };
export type ReferenceSnapshot = Pick<
  ReferenceDto,
  "id" | "categoryId" | "categorySlug" | "categoryLabel" | "label" | "tags" | "url" | "contentType"
> & { position: number };

export type AtlasImageGenerationDto = Omit<
  AtlasImageGenerationRow,
  "directionSnapshotJson" | "referenceSnapshotJson"
> & {
  directions: DirectionSnapshot[];
  references: ReferenceSnapshot[];
  source: ReturnType<typeof toFileAssetDto>;
  output: ReturnType<typeof toFileAssetDto> | null;
};

function parseDirections(value: string) {
  return JSON.parse(value) as DirectionSnapshot[];
}

function parseReferences(value: string) {
  return JSON.parse(value) as ReferenceSnapshot[];
}

export function compileAtlasImagePrompt(
  directions: DirectionSnapshot[],
  references: ReferenceSnapshot[]
) {
  const referenceGuide = references.length
    ? references
        .map((reference, index) => `Image ${index + 2}: ${reference.label} (${reference.categoryLabel})`)
        .join("\n")
    : "No additional reference images were selected.";
  const directionGuide = directions
    .map((direction, index) => `${index + 1}. ${direction.body}`)
    .join("\n");
  return [
    "Create one photorealistic renovation concept by editing Image 1, the structural source.",
    "Preserve the source camera angle, room geometry, openings, and all elements the user did not ask to change.",
    "Reference inputs, in their selected order:",
    referenceGuide,
    "User direction entries, in chronological order:",
    directionGuide,
    "Apply the user directions to Image 1. Use later images only as visual references, not as structural sources.",
  ].join("\n\n");
}

export function classifyAtlasImageError(error: unknown): {
  status: Exclude<AtlasImageGenerationStatus, "generating" | "complete">;
  code: string;
  message: string;
} {
  if (error instanceof AtlasProviderError) {
    if (error.providerCode === "cancelled" || error.httpStatus === 499) {
      return { status: "cancelled", code: "cancelled", message: error.message };
    }
    if (error.httpStatus === 401 || error.httpStatus === 403) {
      return { status: "blocked", code: error.providerCode ?? "provider_access_blocked", message: error.message };
    }
    if (error.httpStatus === 408 || error.httpStatus === 409 || error.httpStatus === 429 || (error.httpStatus ?? 0) >= 500) {
      return { status: "retryable", code: error.providerCode ?? "provider_retryable", message: error.message };
    }
    return { status: "failed", code: error.providerCode ?? "provider_failed", message: error.message };
  }
  if (error instanceof ApiError && error.code === "asset_upload_failed") {
    const details = error.details as { causeCode?: string } | undefined;
    if (details?.causeCode === "bunny_not_configured") {
      return { status: "blocked", code: "bunny_not_configured", message: error.message };
    }
    return { status: "retryable", code: "storage_upload_failed", message: error.message };
  }
  return {
    status: "retryable",
    code: "unexpected_generation_error",
    message: "Atlas could not finish this attempt. Your snapshot is saved and can be retried.",
  };
}

async function assertSource(fileId: string, sourceAssetId: string) {
  const source = await getFileAsset(fileId, sourceAssetId);
  if (!source || source.status !== "ready" || !source.url) {
    throw new ApiError(400, "source_not_ready", "Choose one ready image from this file.");
  }
  return source;
}

export async function createAtlasImageSession(input: {
  fileId: string;
  sourceAssetId: string;
  parentGenerationId?: string | null;
}) {
  await assertSource(input.fileId, input.sourceAssetId);
  if (input.parentGenerationId) {
    const parent = await getAtlasImageGeneration(input.fileId, input.parentGenerationId);
    if (!parent || parent.status !== "complete" || parent.outputAssetId !== input.sourceAssetId) {
      throw new ApiError(400, "invalid_lineage", "Continue editing must use the completed parent output.");
    }
  }
  const db = await getDb();
  const now = Date.now();
  const row = {
    id: `ais_${randomUUID()}`,
    fileId: input.fileId,
    sourceAssetId: input.sourceAssetId,
    parentGenerationId: input.parentGenerationId ?? null,
    createdAt: now,
    updatedAt: now,
  };
  db.insert(atlasImageSessions).values(row).run();
  await persistDatabase();
  return row;
}

export async function getAtlasImageSession(fileId: string, sessionId: string) {
  const db = await getDb();
  const session = db
    .select()
    .from(atlasImageSessions)
    .where(and(eq(atlasImageSessions.id, sessionId), eq(atlasImageSessions.fileId, fileId)))
    .get();
  if (!session) return null;
  const directions = db
    .select()
    .from(atlasImageDirections)
    .where(eq(atlasImageDirections.sessionId, session.id))
    .orderBy(asc(atlasImageDirections.position))
    .all();
  const referenceLinks = db
    .select()
    .from(atlasImageSessionReferences)
    .where(eq(atlasImageSessionReferences.sessionId, session.id))
    .orderBy(asc(atlasImageSessionReferences.position))
    .all();
  const catalog = await listReferenceCatalog();
  const byId = new Map(catalog.images.map((reference) => [reference.id, reference]));
  const references = referenceLinks
    .map((link) => {
      const reference = byId.get(link.referenceId);
      return reference ? { ...reference, position: link.position } : null;
    })
    .filter((reference): reference is ReferenceDto & { position: number } => Boolean(reference));
  const source = await assertSource(fileId, session.sourceAssetId);
  return { ...session, directions, references, source: toFileAssetDto(source), catalog };
}

export async function appendAtlasImageDirection(fileId: string, sessionId: string, body: string) {
  const session = await getAtlasImageSession(fileId, sessionId);
  if (!session) throw new ApiError(404, "session_not_found", "That Atlas Image draft no longer exists.");
  const db = await getDb();
  const previous = db
    .select({ position: atlasImageDirections.position })
    .from(atlasImageDirections)
    .where(eq(atlasImageDirections.sessionId, sessionId))
    .orderBy(desc(atlasImageDirections.position))
    .get();
  const row = {
    id: `aid_${randomUUID()}`,
    sessionId,
    body: body.trim(),
    position: (previous?.position ?? -1) + 1,
    createdAt: Date.now(),
  };
  db.insert(atlasImageDirections).values(row).run();
  db.update(atlasImageSessions).set({ updatedAt: Date.now() }).where(eq(atlasImageSessions.id, sessionId)).run();
  await persistDatabase();
  return row;
}

export async function setAtlasImageReferences(fileId: string, sessionId: string, referenceIds: string[]) {
  const session = await getAtlasImageSession(fileId, sessionId);
  if (!session) throw new ApiError(404, "session_not_found", "That Atlas Image draft no longer exists.");
  const db = await getDb();
  if (referenceIds.length) {
    const found = db
      .select({ id: referenceImages.id })
      .from(referenceImages)
      .where(inArray(referenceImages.id, referenceIds))
      .all();
    if (found.length !== referenceIds.length) {
      throw new ApiError(400, "reference_not_found", "One selected catalog reference no longer exists.");
    }
  }
  db.transaction((tx) => {
    tx.delete(atlasImageSessionReferences).where(eq(atlasImageSessionReferences.sessionId, sessionId)).run();
    if (referenceIds.length) {
      tx.insert(atlasImageSessionReferences)
        .values(referenceIds.map((referenceId, position) => ({ sessionId, referenceId, position })))
        .run();
    }
    tx.update(atlasImageSessions).set({ updatedAt: Date.now() }).where(eq(atlasImageSessions.id, sessionId)).run();
  });
  await persistDatabase();
  return getAtlasImageSession(fileId, sessionId);
}

export async function uploadAtlasImageSessionReference(input: {
  fileId: string;
  sessionId: string;
  label: string;
  filename: string;
  contentType: string;
  bytes: Uint8Array;
}, storeObject?: ReferenceObjectWriter) {
  const session = await getAtlasImageSession(input.fileId, input.sessionId);
  if (!session) throw new ApiError(404, "session_not_found", "That Atlas Image draft no longer exists.");
  if (session.references.length >= 20) {
    throw new ApiError(400, "reference_limit", "Atlas Image supports up to 20 references per generation.");
  }

  const category = await ensureReferenceCategory({
    slug: "session-uploads",
    label: "Uploads",
    sortOrder: 999,
  });
  const uploaded = await uploadReferenceImage({
    category: category.slug,
    label: input.label,
    tags: ["session-upload"],
    filename: input.filename,
    contentType: input.contentType,
    bytes: input.bytes,
    createdBy: "device-session",
  }, storeObject);
  const referenceIds = [...session.references.map((reference) => reference.id), uploaded.id];
  const updated = await setAtlasImageReferences(input.fileId, input.sessionId, referenceIds);
  const reference = updated?.references.find((item) => item.id === uploaded.id);
  if (!reference) throw new ApiError(500, "reference_link_failed", "Atlas uploaded the image but could not attach it to this draft.");
  return { reference, referenceIds };
}

export async function getAtlasImageGeneration(fileId: string, generationId: string) {
  const db = await getDb();
  return db
    .select()
    .from(atlasImageGenerations)
    .where(and(eq(atlasImageGenerations.id, generationId), eq(atlasImageGenerations.fileId, fileId)))
    .get() ?? null;
}

async function toGenerationDto(row: AtlasImageGenerationRow): Promise<AtlasImageGenerationDto> {
  const source = await getFileAsset(row.fileId, row.sourceAssetId);
  if (!source) throw new ApiError(500, "generation_source_missing", "The saved generation source is missing.");
  const output = row.outputAssetId ? await getFileAsset(row.fileId, row.outputAssetId) : null;
  return {
    ...row,
    directions: parseDirections(row.directionSnapshotJson),
    references: parseReferences(row.referenceSnapshotJson),
    source: toFileAssetDto(source),
    output: output ? toFileAssetDto(output) : null,
  };
}

export async function getAtlasImageGenerationDetail(fileId: string, generationId: string) {
  const row = await getAtlasImageGeneration(fileId, generationId);
  return row ? toGenerationDto(row) : null;
}

export async function listAtlasImageHistory(fileId: string) {
  const db = await getDb();
  const rows = db
    .select()
    .from(atlasImageGenerations)
    .where(eq(atlasImageGenerations.fileId, fileId))
    .orderBy(desc(atlasImageGenerations.createdAt))
    .all();
  return Promise.all(rows.map(toGenerationDto));
}

async function loadProviderImage(url: string, fallbackContentType: string, filename: string) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new AtlasProviderError(`Atlas could not retrieve ${filename}.`, 503, "input_fetch_failed");
  }
  return {
    bytes: new Uint8Array(await response.arrayBuffer()),
    contentType: response.headers.get("content-type") || fallbackContentType || "image/jpeg",
    filename,
  } satisfies ProviderImageInput;
}

type GenerationDeps = {
  edit?: (input: AtlasImageEditInput) => Promise<AtlasImageEditResult>;
  loadImage?: typeof loadProviderImage;
  storeOutput?: (input: {
    fileId: string;
    generationId: string;
    bytes: Uint8Array;
    contentType: string;
  }) => Promise<ReturnType<typeof toFileAssetDto>>;
};

export async function runAtlasImageGeneration(
  input: {
    fileId: string;
    sessionId: string;
    clientRequestId: string;
    quality?: AtlasImageQuality;
    attemptOfGenerationId?: string | null;
  },
  deps: GenerationDeps = {}
) {
  const db = await getDb();
  const existing = db
    .select()
    .from(atlasImageGenerations)
    .where(and(
      eq(atlasImageGenerations.fileId, input.fileId),
      eq(atlasImageGenerations.clientRequestId, input.clientRequestId)
    ))
    .get();
  if (existing) return toGenerationDto(existing);

  const session = await getAtlasImageSession(input.fileId, input.sessionId);
  if (!session) throw new ApiError(404, "session_not_found", "That Atlas Image draft no longer exists.");
  if (!session.directions.length) {
    throw new ApiError(400, "direction_required", "Add at least one direction before generating.");
  }
  const directions: DirectionSnapshot[] = session.directions.map((direction) => ({
    id: direction.id,
    position: direction.position,
    body: direction.body,
    createdAt: direction.createdAt,
  }));
  const references: ReferenceSnapshot[] = session.references.map((reference) => ({
    id: reference.id,
    categoryId: reference.categoryId,
    categorySlug: reference.categorySlug,
    categoryLabel: reference.categoryLabel,
    label: reference.label,
    tags: reference.tags,
    url: reference.url,
    contentType: reference.contentType,
    position: reference.position,
  }));
  const quality = input.quality ?? getOpenAIEnv().quality;
  const now = Date.now();
  const row = {
    id: `aig_${randomUUID()}`,
    fileId: input.fileId,
    sessionId: session.id,
    clientRequestId: input.clientRequestId,
    attemptOfGenerationId: input.attemptOfGenerationId ?? null,
    parentGenerationId: session.parentGenerationId,
    sourceAssetId: session.sourceAssetId,
    directionSnapshotJson: JSON.stringify(directions),
    compiledPrompt: compileAtlasImagePrompt(directions, references),
    referenceSnapshotJson: JSON.stringify(references),
    providerRequestId: null,
    model: "gpt-image-2",
    quality,
    status: "generating" as const,
    errorCode: null,
    errorMessage: null,
    outputAssetId: null,
    createdAt: now,
    startedAt: now,
    completedAt: null,
    updatedAt: now,
  } satisfies AtlasImageGenerationRow;
  db.insert(atlasImageGenerations).values(row).run();
  await persistDatabase();

  try {
    const loadImage = deps.loadImage ?? loadProviderImage;
    const sourceInput = await loadImage(session.source.url, session.source.contentType, `source-${session.source.id}`);
    const referenceInputs = await Promise.all(
      references.map((reference) => loadImage(reference.url, reference.contentType, `reference-${reference.id}`))
    );
    const result = await (deps.edit ?? openAIAtlasProvider.edit)({
      prompt: row.compiledPrompt,
      quality,
      images: [sourceInput, ...referenceInputs],
    });
    db.update(atlasImageGenerations)
      .set({ providerRequestId: result.providerRequestId, updatedAt: Date.now() })
      .where(eq(atlasImageGenerations.id, row.id))
      .run();
    await persistDatabase();

    const storeOutput = deps.storeOutput ?? (async (output) => uploadFileAsset({
      fileId: output.fileId,
      kind: "ai_generated",
      origin: "generated",
      label: `Atlas Image ${new Date().toLocaleDateString("en-NZ")}`,
      room: null,
      tags: ["atlas-image", output.generationId],
      cameraPositionClock: null,
      filename: `${output.generationId}.png`,
      contentType: output.contentType,
      bytes: output.bytes,
    }));
    const output = await storeOutput({
      fileId: input.fileId,
      generationId: row.id,
      bytes: result.bytes,
      contentType: result.contentType,
    });
    const completedAt = Date.now();
    db.update(atlasImageGenerations)
      .set({
        status: "complete",
        outputAssetId: output.id,
        providerRequestId: result.providerRequestId,
        completedAt,
        updatedAt: completedAt,
      })
      .where(eq(atlasImageGenerations.id, row.id))
      .run();
    await persistDatabase();
  } catch (error) {
    const failure = classifyAtlasImageError(error);
    const failedAt = Date.now();
    db.update(atlasImageGenerations)
      .set({
        status: failure.status,
        errorCode: failure.code,
        errorMessage: failure.message,
        completedAt: failedAt,
        updatedAt: failedAt,
      })
      .where(eq(atlasImageGenerations.id, row.id))
      .run();
    await persistDatabase();
  }
  return toGenerationDto((await getAtlasImageGeneration(input.fileId, row.id))!);
}

export async function retryAtlasImageGeneration(
  fileId: string,
  generationId: string,
  clientRequestId: string,
  deps: GenerationDeps = {}
) {
  const generation = await getAtlasImageGenerationDetail(fileId, generationId);
  if (!generation) throw new ApiError(404, "generation_not_found", "That generation no longer exists.");
  if (generation.status === "generating") {
    throw new ApiError(409, "generation_not_retryable", "Wait for the active attempt to finish first.");
  }
  const session = await createAtlasImageSession({
    fileId,
    sourceAssetId: generation.sourceAssetId,
    parentGenerationId: generation.parentGenerationId,
  });
  for (const direction of generation.directions) {
    await appendAtlasImageDirection(fileId, session.id, direction.body);
  }
  await setAtlasImageReferences(fileId, session.id, generation.references.map((reference) => reference.id));
  return runAtlasImageGeneration({
    fileId,
    sessionId: session.id,
    clientRequestId,
    quality: generation.quality,
    attemptOfGenerationId: generation.id,
  }, deps);
}

export async function createContinuationSession(fileId: string, generationId: string) {
  const generation = await getAtlasImageGenerationDetail(fileId, generationId);
  if (!generation?.outputAssetId || generation.status !== "complete") {
    throw new ApiError(409, "generation_not_complete", "Only a completed output can be continued.");
  }
  const session = await createAtlasImageSession({
    fileId,
    sourceAssetId: generation.outputAssetId,
    parentGenerationId: generation.id,
  });
  await setAtlasImageReferences(fileId, session.id, generation.references.map((reference) => reference.id));
  return session;
}

export async function getAtlasImageLineage(fileId: string, generationId: string) {
  const lineage: AtlasImageGenerationDto[] = [];
  let current = await getAtlasImageGenerationDetail(fileId, generationId);
  while (current) {
    lineage.unshift(current);
    current = current.parentGenerationId
      ? await getAtlasImageGenerationDetail(fileId, current.parentGenerationId)
      : null;
  }
  return lineage;
}
