import { afterAll, beforeAll, describe, expect, mock, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import path from "node:path";

const databaseName = `atlas-references-crud-${randomUUID()}.sqlite`;
process.env.DATABASE_PATH = `data/${databaseName}`;
process.env.ATLAS_CLI_ADMIN_TOKEN = "test-cli-admin-token";
process.env.ATLAS_STORAGE_DRIVER = "local";

// No session cookie, so getAuthenticatedSession() resolves to null outside `next dev`.
mock.module("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));

const references = await import("@/features/references/data");
const filesData = await import("@/features/files/data");
const atlas = await import("@/features/atlas-image/data");
const { ApiError } = await import("@/services/api/response");
const { getDb } = await import("@/db/client");
const schema = await import("@/db/schema");
const { eq } = await import("drizzle-orm");
const sessionRoute = await import("@/app/api/references/route");
const sessionItemRoute = await import("@/app/api/references/[id]/route");
const adminItemRoute = await import("@/app/api/admin/references/[id]/route");

const fakeStore = async ({ objectPath }: { objectPath: string }) => ({ storageKey: objectPath, publicUrl: `https://refs.example/${objectPath}` });

async function addReference(label: string) {
  return references.uploadReferenceImage({
    category: "crud-vanities",
    label,
    tags: ["oak"],
    filename: "vanity.jpg",
    contentType: "image/jpeg",
    bytes: new Uint8Array([1, 2, 3]),
    createdBy: "test",
  }, fakeStore);
}

async function referenceRow(id: string) {
  return (await getDb()).select().from(schema.referenceImages).where(eq(schema.referenceImages.id, id)).get();
}

beforeAll(async () => {
  await references.createReferenceCategory({ slug: "crud-vanities", label: "CRUD vanities", sortOrder: 0 });
});

afterAll(async () => {
  await rm(path.join(process.cwd(), "data", databaseName), { force: true });
});

describe("deleteReferenceImage", () => {
  test("deletes an unlinked reference and removes its stored object", async () => {
    const image = await addReference("Unlinked vanity");
    const removed: string[] = [];
    const result = await references.deleteReferenceImage(image.id, async (key) => { removed.push(key); });
    expect(result).toEqual({ id: image.id, label: "Unlinked vanity", storageRemoved: true });
    expect(removed).toEqual([image.storageKey]);
    expect(await referenceRow(image.id)).toBeUndefined();
    expect((await references.listReferenceCatalog()).images.some((item) => item.id === image.id)).toBe(false);
  });

  test("blocks deleting a reference an Atlas image session uses", async () => {
    const image = await addReference("Linked vanity");
    const fileId = await filesData.createFile({
      title: "Reference delete guard",
      relationshipStatus: "qualified_lead",
      workflowStage: "image_concept",
      projectType: "bathroom",
      budgetRange: "20k_35k",
      jobType: "renovation",
      leadSource: "Test",
      contactName: "Atlas Tester",
      contactEmail: "atlas@example.com",
      contactPhone: "123",
      note: "",
    });
    const source = await filesData.uploadFileAsset({
      fileId,
      label: "Vanity wall",
      room: "Bathroom",
      tags: [],
      cameraPositionClock: null,
      origin: "camera",
      filename: "source.jpg",
      contentType: "image/jpeg",
      bytes: new Uint8Array([1, 2, 3]),
    }, fakeStore);
    const session = await atlas.createAtlasImageSession({ fileId, sourceAssetId: source.id });
    await atlas.setAtlasImageReferences(fileId, session.id, [image.id]);

    const removed: string[] = [];
    const error = await references.deleteReferenceImage(image.id, async (key) => { removed.push(key); }).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as InstanceType<typeof ApiError>).status).toBe(409);
    expect((error as InstanceType<typeof ApiError>).code).toBe("reference_in_use");
    expect((error as InstanceType<typeof ApiError>).message).toContain("Linked vanity");
    expect(removed).toEqual([]);
    expect(await referenceRow(image.id)).toBeDefined();
  });

  test("returns 404 for an unknown reference", async () => {
    const error = await references.deleteReferenceImage("reference_missing", async () => {}).catch((caught: unknown) => caught);
    expect((error as InstanceType<typeof ApiError>).status).toBe(404);
  });
});

describe("reference routes reject unauthenticated callers", () => {
  test("session upload route returns 401 without a session", async () => {
    const form = new FormData();
    form.set("category", "crud-vanities");
    form.set("label", "Signed out");
    form.set("image", new Blob([new Uint8Array([1, 2, 3])], { type: "image/jpeg" }), "x.jpg");
    const response = await sessionRoute.POST(new Request("http://atlas.test/api/references", { method: "POST", body: form }));
    expect(response.status).toBe(401);
    expect((await response.json()).error.code).toBe("unauthorized");
  });

  test("session delete route returns 401 and keeps the reference", async () => {
    const image = await addReference("Signed-out delete");
    const response = await sessionItemRoute.DELETE(new Request(`http://atlas.test/api/references/${image.id}`, { method: "DELETE" }), { params: Promise.resolve({ id: image.id }) });
    expect(response.status).toBe(401);
    expect(await referenceRow(image.id)).toBeDefined();
  });

  test("admin delete route rejects a request without the CLI token", async () => {
    const image = await addReference("Admin guarded");
    const response = await adminItemRoute.DELETE(new Request(`http://atlas.test/api/admin/references/${image.id}`, { method: "DELETE" }), { params: Promise.resolve({ id: image.id }) });
    // 401 when a token is configured, 503 when not; bun test shares one parsed env across files.
    expect([401, 503]).toContain(response.status);
    expect(await referenceRow(image.id)).toBeDefined();
  });
});
