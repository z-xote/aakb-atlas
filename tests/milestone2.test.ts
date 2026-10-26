import { afterAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import path from "node:path";

import { ApiError } from "@/services/api/response";

const databaseName = `atlas-milestone2-${randomUUID()}.sqlite`;
process.env.DATABASE_PATH = `data/${databaseName}`;
process.env.ATLAS_STORAGE_DRIVER = "bunny";
process.env.ATLAS_STORAGE_PREFIX = "test atlas aakb-atlas";
process.env.BUNNY_STORAGE_ZONE = "test-zone";
process.env.BUNNY_ACCESS_KEY = "test-key";
process.env.BUNNY_CDN_HOSTNAME = "test-cdn.example";

const filesData = await import("@/features/files/data");
const {
  fileAssetContentType,
  fileAssetMetadataSchema,
  fileAssetUploadFieldsSchema,
  fileCompletionRoute,
  MAX_FILE_ASSET_BYTES,
} = await import("@/features/files/schemas");

const fileInput = {
  title: "Milestone 2 bathroom",
  relationshipStatus: "qualified_lead" as const,
  workflowStage: "site_visit" as const,
  projectType: "bathroom" as const,
  budgetRange: "20k_35k" as const,
  jobType: "renovation" as const,
  leadSource: "Test",
  contactName: "Atlas Tester",
  contactEmail: "atlas@example.com",
  contactPhone: "123",
  note: "",
};

afterAll(async () => {
  await rm(path.join(process.cwd(), "data", databaseName), { force: true });
});

describe("Milestone 2 image contracts", () => {
  test("validates image files, metadata, and the eight allowed camera positions", () => {
    expect(fileAssetContentType({ name: "room.heic", type: "" })).toBe("image/heic");
    expect(fileAssetContentType({ name: "notes.pdf", type: "application/pdf" })).toBeNull();
    expect(MAX_FILE_ASSET_BYTES).toBe(12 * 1024 * 1024);
    expect(fileAssetUploadFieldsSchema.safeParse({ label: "Door", room: null, origin: "camera", cameraPositionClock: "6", tags: [], retryAssetId: null }).success).toBe(true);
    expect(fileAssetUploadFieldsSchema.safeParse({ label: "Door", room: null, origin: "generated", cameraPositionClock: "5", tags: [], retryAssetId: null }).success).toBe(false);
    expect(fileAssetMetadataSchema.safeParse({ label: "", room: null, cameraPositionClock: null, tags: [] }).success).toBe(false);
  });

  test("stores a successful upload as ready under the isolated Bunny prefix", async () => {
    const fileId = await filesData.createFile(fileInput);
    const asset = await filesData.uploadFileAsset({
      fileId,
      label: "Vanity wall",
      room: "Bathroom",
      tags: ["vanity"],
      cameraPositionClock: "6",
      origin: "camera",
      filename: "vanity.jpg",
      contentType: "image/jpeg",
      bytes: new Uint8Array([255, 216, 255, 217]),
    }, async ({ objectPath }) => ({
      storageKey: `test atlas aakb-atlas/${objectPath}`,
      publicUrl: `https://test-cdn.example/test%20atlas%20aakb-atlas/${objectPath}`,
    }));
    expect(asset).toMatchObject({ status: "ready", room: "Bathroom", cameraPositionClock: "6", tags: ["vanity"] });
    expect(asset.storageKey.startsWith("test atlas aakb-atlas/files/")).toBe(true);
    expect(asset.url).toContain("test%20atlas%20aakb-atlas/files/");
  });

  test("persists a retryable failed state when Bunny rejects bytes", async () => {
    const fileId = await filesData.createFile({ ...fileInput, title: "Failed Bunny upload" });
    let failedAssetId = "";
    try {
      await filesData.uploadFileAsset({
        fileId,
        label: "Shower wall",
        room: null,
        tags: [],
        cameraPositionClock: null,
        origin: "upload",
        filename: "shower.png",
        contentType: "image/png",
        bytes: new Uint8Array([137, 80, 78, 71]),
      }, async () => {
        throw new Error("Bunny rejected the upload");
      });
    } catch (error) {
      const details = (error as { details?: { assetId?: string } }).details;
      failedAssetId = details?.assetId ?? "";
    }
    expect(failedAssetId).not.toBe("");
    expect(await filesData.getFileAsset(fileId, failedAssetId)).toMatchObject({ status: "failed", errorMessage: "Upload failed. Check storage and try again." });
  });

  test("preserves a missing Bunny configuration as a blocked, non-retryable cause", async () => {
    const fileId = await filesData.createFile({ ...fileInput, title: "Missing Bunny configuration" });
    await expect(filesData.uploadFileAsset({
      fileId,
      label: "Generated output",
      room: null,
      tags: [],
      cameraPositionClock: null,
      origin: "generated",
      filename: "output.png",
      contentType: "image/png",
      bytes: new Uint8Array([137, 80, 78, 71]),
    }, async () => {
      throw new ApiError(503, "bunny_not_configured", "Bunny storage is not configured on the Atlas server.");
    })).rejects.toMatchObject({
      status: 503,
      code: "asset_upload_failed",
      message: "Bunny storage is not configured on the Atlas server.",
      details: { retryable: false, causeCode: "bunny_not_configured" },
    });
  });

  test("enforces file ownership and round-trips editable metadata", async () => {
    const firstFile = await filesData.createFile({ ...fileInput, title: "First file" });
    const secondFile = await filesData.createFile({ ...fileInput, title: "Second file" });
    const asset = await filesData.uploadFileAsset({
      fileId: firstFile,
      label: "Before",
      room: null,
      tags: [],
      cameraPositionClock: null,
      origin: "upload",
      filename: "before.webp",
      contentType: "image/webp",
      bytes: new Uint8Array([82, 73, 70, 70]),
    }, async ({ objectPath }) => ({ storageKey: objectPath, publicUrl: `https://test-cdn.example/${objectPath}` }));
    await expect(filesData.updateFileAssetMetadata(secondFile, asset.id, { label: "Wrong file", room: null, tags: [], cameraPositionClock: null })).rejects.toMatchObject({ code: "asset_not_found" });
    const updated = await filesData.updateFileAssetMetadata(firstFile, asset.id, { label: "North wall", room: "Custom scullery", tags: ["north", "existing"], cameraPositionClock: "10" });
    expect(updated).toMatchObject({ label: "North wall", room: "Custom scullery", tags: ["north", "existing"], cameraPositionClock: "10" });
  });

  test("routes create-and-photo directly into capture review", () => {
    expect(fileCompletionRoute("file_123", "capture")).toBe("/files/file_123/images/capture");
    expect(fileCompletionRoute("file_123", "create")).toBe("/files/file_123");
  });
});
