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
const categoryItemRoute = await import("@/app/api/references/categories/[slug]/route");
const { readReferenceEditForm } = await import("@/features/references/schemas");

const fakeStore = async ({ objectPath }: { objectPath: string }) => ({ storageKey: objectPath, publicUrl: `https://refs.example/${objectPath}` });

async function addReference(label: string, category = "crud-vanities") {
  return references.uploadReferenceImage({
    category,
    label,
    tags: ["oak"],
    filename: "vanity.jpg",
    contentType: "image/jpeg",
    bytes: new Uint8Array([1, 2, 3]),
    createdBy: "test",
  }, fakeStore);
}

async function categoryRow(slug: string) {
  return (await getDb()).select().from(schema.referenceCategories).where(eq(schema.referenceCategories.slug, slug)).get();
}

async function referenceRow(id: string) {
  return (await getDb()).select().from(schema.referenceImages).where(eq(schema.referenceImages.id, id)).get();
}

beforeAll(async () => {
  await references.createReferenceCategory({ slug: "crud-vanities", label: "CRUD vanities", sortOrder: 0 });
  // Keeps crud-vanities alive while other tests delete its references.
  await addReference("Anchor vanity");
});

afterAll(async () => {
  await rm(path.join(process.cwd(), "data", databaseName), { force: true });
});

describe("deleteReferenceImage", () => {
  test("deletes an unlinked reference and removes its stored object", async () => {
    const image = await addReference("Unlinked vanity");
    const removed: string[] = [];
    const result = await references.deleteReferenceImage(image.id, async (key) => { removed.push(key); });
    expect(result).toEqual({ id: image.id, label: "Unlinked vanity", storageRemoved: true, categoryRemoved: false });
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

describe("addReferenceCategory", () => {
  test("derives the slug from the label and appends after the last category", async () => {
    const before = (await references.listReferenceCatalog()).categories;
    const created = await references.addReferenceCategory("Shower Screens & Glass");
    expect(created.slug).toBe("shower-screens-glass");
    expect(created.sortOrder).toBe(Math.max(...before.map((item) => item.sortOrder)) + 1);
    const error = await references.addReferenceCategory("shower screens glass").catch((caught: unknown) => caught);
    expect((error as InstanceType<typeof ApiError>).code).toBe("category_exists");
  });
});

describe("new category with a reference", () => {
  test("creates the named category together with the reference", async () => {
    const image = await references.uploadReferenceImage({ newCategory: "Towel rails", label: "Heated rail", tags: [], filename: "rail.jpg", contentType: "image/jpeg", bytes: new Uint8Array([1]), createdBy: "test" }, fakeStore);
    expect(image.categorySlug).toBe("towel-rails");
    expect(await categoryRow("towel-rails")).toBeDefined();
  });

  test("reuses an existing category with the same name", async () => {
    const image = await references.uploadReferenceImage({ newCategory: "crud vanities", label: "Reused", tags: [], filename: "r.jpg", contentType: "image/jpeg", bytes: new Uint8Array([1]), createdBy: "test" }, fakeStore);
    expect(image.categorySlug).toBe("crud-vanities");
  });

  test("leaves no category behind when the upload fails", async () => {
    const failingStore = async () => { throw new Error("storage down"); };
    const error = await references.uploadReferenceImage({ newCategory: "Ghost category", label: "Never saved", tags: [], filename: "g.jpg", contentType: "image/jpeg", bytes: new Uint8Array([1]), createdBy: "test" }, failingStore).catch((caught: unknown) => caught);
    expect((error as Error).message).toBe("storage down");
    expect(await categoryRow("ghost-category")).toBeUndefined();
  });

  test("an edit can move a reference into a new category", async () => {
    const image = await addReference("Moving to new");
    const result = await references.updateReferenceImage(image.id, { newCategory: "Fresh hooks", image: null }, fakeStore, async () => {});
    expect(result.categorySlug).toBe("fresh-hooks");
  });
});

describe("category clean-up", () => {
  test("deleting the last reference removes its category", async () => {
    await references.addReferenceCategory("Solo mirrors");
    const image = await addReference("Only mirror", "solo-mirrors");
    const result = await references.deleteReferenceImage(image.id, async () => {});
    expect(result.categoryRemoved).toBe(true);
    expect(await categoryRow("solo-mirrors")).toBeUndefined();
  });

  test("moving the last reference out removes the old category", async () => {
    await references.addReferenceCategory("Solo lights");
    const image = await addReference("Only light", "solo-lights");
    const result = await references.updateReferenceImage(image.id, { category: "crud-vanities", image: null }, fakeStore, async () => {});
    expect(result.categoryRemoved).toBe(true);
    expect(await categoryRow("solo-lights")).toBeUndefined();
  });

  test("a category with references left is kept", async () => {
    const image = await addReference("One of many");
    expect((await references.deleteReferenceImage(image.id, async () => {})).categoryRemoved).toBe(false);
    expect(await categoryRow("crud-vanities")).toBeDefined();
  });
});

describe("renameReferenceCategory", () => {
  test("renames the label and slug, and refuses a name that is taken", async () => {
    await references.addReferenceCategory("Old basins");
    await addReference("Basin", "old-basins");
    const renamed = await references.renameReferenceCategory("old-basins", "Stone basins");
    expect(renamed.slug).toBe("stone-basins");
    expect((await categoryRow("stone-basins"))?.label).toBe("Stone basins");
    const error = await references.renameReferenceCategory("stone-basins", "CRUD vanities").catch((caught: unknown) => caught);
    expect((error as InstanceType<typeof ApiError>).code).toBe("category_exists");
  });
});

describe("updateReferenceImage", () => {
  test("keeps fields the edit leaves out", async () => {
    const image = await addReference("Partial edit");
    await references.updateReferenceImage(image.id, { label: "Only the label", image: null }, fakeStore, async () => {});
    const row = await referenceRow(image.id);
    expect(row?.label).toBe("Only the label");
    expect(row?.tagsJson).toBe(JSON.stringify(["oak"]));
    expect(row?.categoryId).toBe(image.categoryId);
  });

  test("an absent tags field keeps tags and an empty one clears them", async () => {
    const absent = new FormData();
    absent.set("label", "x");
    expect((await readReferenceEditForm(absent)).tags).toBeUndefined();
    const empty = new FormData();
    empty.set("tags", "");
    expect((await readReferenceEditForm(empty)).tags).toEqual([]);
  });

  test("changes label, category and tags without touching storage", async () => {
    const image = await addReference("Metadata only");
    await references.ensureReferenceCategory({ slug: "crud-baths", label: "CRUD baths", sortOrder: 5 });
    const removed: string[] = [];
    const result = await references.updateReferenceImage(image.id, { label: "Renamed", category: "crud-baths", tags: ["walnut"], image: null }, fakeStore, async (key) => { removed.push(key); });
    expect(result.categorySlug).toBe("crud-baths");
    expect(removed).toEqual([]);
    const row = await referenceRow(image.id);
    expect(row?.label).toBe("Renamed");
    expect(row?.tagsJson).toBe(JSON.stringify(["walnut"]));
    expect(row?.storageKey).toBe(image.storageKey);
  });

  test("stores a replacement image under a new key and removes the old object", async () => {
    const image = await addReference("Replace me");
    const removed: string[] = [];
    await references.updateReferenceImage(image.id, {
      label: "Replaced",
      category: "crud-vanities",
      tags: [],
      image: { filename: "new.png", contentType: "image/png", bytes: new Uint8Array([4, 5, 6, 7]) },
    }, fakeStore, async (key) => { removed.push(key); });
    const row = await referenceRow(image.id);
    expect(row?.storageKey).not.toBe(image.storageKey);
    expect(row?.storageKey.endsWith(".png")).toBe(true);
    expect(row?.contentType).toBe("image/png");
    expect(row?.sizeBytes).toBe(4);
    expect(removed).toEqual([image.storageKey]);
  });
});

describe("reference routes reject unauthenticated callers", () => {
  test("session category rename route returns 401 without a session", async () => {
    const response = await categoryItemRoute.PATCH(new Request("http://atlas.test/api/references/categories/crud-vanities", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ label: "Signed out" }) }), { params: Promise.resolve({ slug: "crud-vanities" }) });
    expect(response.status).toBe(401);
    expect((await categoryRow("crud-vanities"))?.label).toBe("CRUD vanities");
  });

  test("session edit route returns 401 and keeps the reference", async () => {
    const image = await addReference("Signed-out edit");
    const form = new FormData();
    form.set("category", "crud-vanities");
    form.set("label", "Changed");
    const response = await sessionItemRoute.PATCH(new Request(`http://atlas.test/api/references/${image.id}`, { method: "PATCH", body: form }), { params: Promise.resolve({ id: image.id }) });
    expect(response.status).toBe(401);
    expect((await referenceRow(image.id))?.label).toBe("Signed-out edit");
  });


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
