import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import path from "node:path";
import type { AtlasImageEditInput } from "@/services/openai/client";

const databaseName = `atlas-milestone3-${randomUUID()}.sqlite`;
process.env.DATABASE_PATH = `data/${databaseName}`;
process.env.ATLAS_STORAGE_DRIVER = "local";
process.env.ATLAS_IMAGE_QUALITY = "medium";

const atlas = await import("@/features/atlas-image/data");
const filesData = await import("@/features/files/data");
const { transcriptionToComposerDraft } = await import("@/features/atlas-image/schemas");
const { AtlasProviderError } = await import("@/services/openai/client");
const { ApiError } = await import("@/services/api/response");
const { getDb, persistDatabase } = await import("@/db/client");
const schema = await import("@/db/schema");

const fileInput = {
  title: "Milestone 3 bathroom",
  relationshipStatus: "qualified_lead" as const,
  workflowStage: "design_concept" as const,
  projectType: "bathroom" as const,
  budgetRange: "20k_35k" as const,
  jobType: "renovation" as const,
  leadSource: "Test",
  contactName: "Atlas Tester",
  contactEmail: "atlas@example.com",
  contactPhone: "123",
  note: "",
};

let fileId = "";
let sourceId = "";
let referenceIds: string[] = [];

beforeAll(async () => {
  fileId = await filesData.createFile(fileInput);
  const source = await filesData.uploadFileAsset({
    fileId,
    label: "Vanity wall before",
    room: "Bathroom",
    tags: ["vanity"],
    cameraPositionClock: "6",
    origin: "camera",
    filename: "source.jpg",
    contentType: "image/jpeg",
    bytes: new Uint8Array([1, 2, 3]),
  }, async ({ objectPath }) => ({ storageKey: objectPath, publicUrl: `https://inputs.example/${objectPath}` }));
  sourceId = source.id;
  const db = await getDb();
  const now = Date.now();
  const categoryId = `refcat_${randomUUID()}`;
  db.insert(schema.referenceCategories).values({ id: categoryId, slug: "vanities", label: "Vanities", sortOrder: 0, createdAt: now, updatedAt: now }).run();
  referenceIds = [`reference_${randomUUID()}`, `reference_${randomUUID()}`];
  db.insert(schema.referenceImages).values(referenceIds.map((id, index) => ({ id, categoryId, label: `Reference ${index + 1}`, tagsJson: "[]", storageKey: `refs/${id}.jpg`, publicUrl: `https://inputs.example/${id}.jpg`, contentType: "image/jpeg", sizeBytes: 3, createdBy: "test", createdAt: now + index, updatedAt: now + index }))).run();
  await persistDatabase();
});

afterAll(async () => {
  await rm(path.join(process.cwd(), "data", databaseName), { force: true });
});

async function draft(directions = ["Keep the window.", "Use a sage wall-hung vanity."], refs = [referenceIds[1], referenceIds[0]]) {
  const session = await atlas.createAtlasImageSession({ fileId, sourceAssetId: sourceId });
  for (const body of directions) await atlas.appendAtlasImageDirection(fileId, session.id, body);
  await atlas.setAtlasImageReferences(fileId, session.id, refs);
  return session;
}

function successfulDeps(onEdit?: (input: AtlasImageEditInput) => void) {
  return {
    loadImage: async (_url: string, contentType: string, filename: string) => ({ bytes: new Uint8Array([1, 2, 3]), contentType, filename }),
    edit: async (input: AtlasImageEditInput) => {
      onEdit?.(input);
      return { bytes: new Uint8Array([137, 80, 78, 71]), contentType: "image/png", providerRequestId: "req_provider_123" };
    },
    storeOutput: async ({ fileId: outputFileId, generationId, bytes, contentType }: { fileId: string; generationId: string; bytes: Uint8Array; contentType: string }) => filesData.uploadFileAsset({ fileId: outputFileId, kind: "ai_generated", origin: "generated", label: "Generated test concept", room: null, tags: [generationId], cameraPositionClock: null, filename: `${generationId}.png`, contentType, bytes }, async ({ objectPath }) => ({ storageKey: objectPath, publicUrl: `https://outputs.example/${objectPath}` })),
  };
}

describe("Milestone 3 Atlas Image contracts", () => {
  test("snapshots chronological directions and sends source then ordered references to one gpt-image-2 edit", async () => {
    const session = await draft();
    let providerInput: AtlasImageEditInput | undefined;
    const generation = await atlas.runAtlasImageGeneration({ fileId, sessionId: session.id, clientRequestId: `client_${randomUUID()}`, quality: "medium" }, successfulDeps((input) => { providerInput = input; }));
    expect(generation.status).toBe("complete");
    expect(generation.model).toBe("gpt-image-2");
    expect(generation.quality).toBe("medium");
    expect(providerInput?.images.map((image) => image.filename)).toEqual([`source-${sourceId}`, `reference-${referenceIds[1]}`, `reference-${referenceIds[0]}`]);
    expect(providerInput?.prompt.indexOf("1. Keep the window.")).toBeLessThan(providerInput?.prompt.indexOf("2. Use a sage wall-hung vanity.") ?? 0);
    expect(generation.references.map((reference) => reference.id)).toEqual([referenceIds[1], referenceIds[0]]);
    expect(generation.output).toMatchObject({ kind: "ai_generated", status: "ready", origin: "generated" });
  });

  test("idempotent client request IDs never duplicate the provider job", async () => {
    const session = await draft(["Keep the room geometry."], []);
    const clientRequestId = `client_${randomUUID()}`;
    let calls = 0;
    const deps = successfulDeps(() => { calls += 1; });
    const first = await atlas.runAtlasImageGeneration({ fileId, sessionId: session.id, clientRequestId }, deps);
    const second = await atlas.runAtlasImageGeneration({ fileId, sessionId: session.id, clientRequestId }, deps);
    expect(second.id).toBe(first.id);
    expect(calls).toBe(1);
  });

  test("uploads an optional composer image and sends it as the next ordered reference", async () => {
    const session = await atlas.createAtlasImageSession({ fileId, sourceAssetId: sourceId });
    await atlas.appendAtlasImageDirection(fileId, session.id, "Keep the layout and use this finish reference.");
    const attached = await atlas.uploadAtlasImageSessionReference({
      fileId,
      sessionId: session.id,
      label: "Local finish sample",
      filename: "finish-sample.png",
      contentType: "image/png",
      bytes: new Uint8Array([137, 80, 78, 71]),
    }, async ({ objectPath }) => ({
      storageKey: objectPath,
      publicUrl: `https://uploads.example/${objectPath}`,
    }));
    expect(attached.reference).toMatchObject({ label: "Local finish sample", categorySlug: "session-uploads", position: 0 });
    let providerInput: AtlasImageEditInput | undefined;
    await atlas.runAtlasImageGeneration({ fileId, sessionId: session.id, clientRequestId: `client_${randomUUID()}` }, successfulDeps((input) => { providerInput = input; }));
    expect(providerInput?.images.map((image) => image.filename)).toEqual([`source-${sourceId}`, `reference-${attached.reference.id}`]);
  });

  test("does not mark complete before Bunny/output persistence succeeds", async () => {
    const session = await draft(["Add warmer lighting."], []);
    let statusDuringStorage = "";
    const deps = successfulDeps();
    deps.storeOutput = async ({ generationId }) => {
      statusDuringStorage = (await atlas.getAtlasImageGeneration(fileId, generationId))?.status ?? "";
      throw new ApiError(502, "asset_upload_failed", "Bunny rejected the output.");
    };
    const generation = await atlas.runAtlasImageGeneration({ fileId, sessionId: session.id, clientRequestId: `client_${randomUUID()}` }, deps);
    expect(statusDuringStorage).toBe("generating");
    expect(generation.status).toBe("retryable");
    expect(generation.outputAssetId).toBeNull();
    expect(generation.providerRequestId).toBe("req_provider_123");
  });

  test("classifies access as blocked, transient provider errors as retryable, and aborts as cancelled", () => {
    expect(atlas.classifyAtlasImageError(new AtlasProviderError("Verify the organization.", 403, "access_denied"))).toMatchObject({ status: "blocked" });
    expect(atlas.classifyAtlasImageError(new AtlasProviderError("Rate limited.", 429, "rate_limit"))).toMatchObject({ status: "retryable" });
    expect(atlas.classifyAtlasImageError(new AtlasProviderError("Cancelled.", 499, "cancelled"))).toMatchObject({ status: "cancelled" });
    expect(atlas.classifyAtlasImageError(new AtlasProviderError("Bad input.", 400, "invalid_image"))).toMatchObject({ status: "failed" });
    expect(atlas.classifyAtlasImageError(new ApiError(503, "asset_upload_failed", "Bunny is not configured.", {
      causeCode: "bunny_not_configured",
    }))).toMatchObject({ status: "blocked", code: "bunny_not_configured" });
  });

  test("voice transcription becomes only an editable draft and directions remain user-only immutable rows", async () => {
    const session = await atlas.createAtlasImageSession({ fileId, sourceAssetId: sourceId });
    const transcript = transcriptionToComposerDraft("  Make the tapware brass, but keep the window.  ");
    expect(transcript).toBe("Make the tapware brass, but keep the window.");
    expect((await atlas.getAtlasImageSession(fileId, session.id))?.directions).toHaveLength(0);
    const saved = await atlas.appendAtlasImageDirection(fileId, session.id, transcript);
    expect(saved).not.toHaveProperty("role");
    expect(saved).not.toHaveProperty("author");
    expect((await atlas.getAtlasImageSession(fileId, session.id))?.directions.map((entry) => entry.body)).toEqual([transcript]);
  });

  test("continue editing uses the completed output as source and preserves prior lineage", async () => {
    const firstSession = await draft(["Replace the vanity."], [referenceIds[0]]);
    const first = await atlas.runAtlasImageGeneration({ fileId, sessionId: firstSession.id, clientRequestId: `client_${randomUUID()}` }, successfulDeps());
    const continuation = await atlas.createContinuationSession(fileId, first.id);
    const continuationDetail = await atlas.getAtlasImageSession(fileId, continuation.id);
    expect(continuationDetail).toMatchObject({ sourceAssetId: first.outputAssetId, parentGenerationId: first.id });
    expect(continuationDetail?.directions).toHaveLength(0);
    expect(continuationDetail?.references.map((reference) => reference.id)).toEqual([referenceIds[0]]);
    await atlas.appendAtlasImageDirection(fileId, continuation.id, "Now use a pill mirror.");
    const second = await atlas.runAtlasImageGeneration({ fileId, sessionId: continuation.id, clientRequestId: `client_${randomUUID()}`, quality: "high" }, successfulDeps());
    expect((await atlas.getAtlasImageLineage(fileId, second.id)).map((generation) => generation.id)).toEqual([first.id, second.id]);
    expect(second.parentGenerationId).toBe(first.id);
    expect(second.quality).toBe("high");
  });
});
