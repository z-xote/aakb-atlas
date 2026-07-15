import { randomUUID } from "node:crypto";
import { asc, eq } from "drizzle-orm";

import { getDb, persistDatabase } from "@/db/client";
import { referenceCategories, referenceImages } from "@/db/schema";
import { ApiError } from "@/services/api/response";
import { uploadStoredObject, type StoredObject } from "@/services/bunny/client";

export type ReferenceObjectWriter = (input: {
  objectPath: string;
  bytes: Uint8Array;
  contentType: string;
}) => Promise<StoredObject>;

export type ReferenceDto = {
  id: string;
  categoryId: string;
  categorySlug: string;
  categoryLabel: string;
  label: string;
  tags: string[];
  url: string;
  contentType: string;
  sizeBytes: number;
  createdAt: number;
};

export async function listReferenceCatalog() {
  const db = await getDb();
  const categories = db
    .select()
    .from(referenceCategories)
    .orderBy(asc(referenceCategories.sortOrder), asc(referenceCategories.label))
    .all();
  const images = db
    .select({ image: referenceImages, category: referenceCategories })
    .from(referenceImages)
    .innerJoin(referenceCategories, eq(referenceCategories.id, referenceImages.categoryId))
    .orderBy(asc(referenceImages.label))
    .all()
    .map(({ image, category }): ReferenceDto => ({
      id: image.id,
      categoryId: category.id,
      categorySlug: category.slug,
      categoryLabel: category.label,
      label: image.label,
      tags: JSON.parse(image.tagsJson) as string[],
      url: image.publicUrl,
      contentType: image.contentType,
      sizeBytes: image.sizeBytes,
      createdAt: image.createdAt,
    }));
  return { categories, images };
}

export async function createReferenceCategory(input: { slug: string; label: string; sortOrder: number }) {
  const db = await getDb();
  if (db.select({ id: referenceCategories.id }).from(referenceCategories).where(eq(referenceCategories.slug, input.slug)).get()) {
    throw new ApiError(409, "category_exists", "A reference category with that slug already exists.");
  }
  const now = Date.now();
  const row = { id: `refcat_${randomUUID()}`, ...input, createdAt: now, updatedAt: now };
  db.insert(referenceCategories).values(row).run();
  await persistDatabase();
  return row;
}

export async function ensureReferenceCategory(input: { slug: string; label: string; sortOrder: number }) {
  const db = await getDb();
  const existing = db.select().from(referenceCategories).where(eq(referenceCategories.slug, input.slug)).get();
  if (existing) return existing;
  return createReferenceCategory(input);
}

export async function uploadReferenceImage(input: {
  category: string;
  label: string;
  tags: string[];
  filename: string;
  contentType: string;
  bytes: Uint8Array;
  createdBy: string;
}, storeObject: ReferenceObjectWriter = uploadStoredObject) {
  const db = await getDb();
  const category = db
    .select()
    .from(referenceCategories)
    .where(eq(referenceCategories.slug, input.category))
    .get();
  if (!category) throw new ApiError(404, "category_not_found", "No reference category matches that slug.");

  const id = `reference_${randomUUID()}`;
  const extension = input.filename.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "bin";
  const stored = await storeObject({
    objectPath: `references/${category.id}/${id}.${extension}`,
    bytes: input.bytes,
    contentType: input.contentType,
  });
  const now = Date.now();
  const row = {
    id,
    categoryId: category.id,
    label: input.label,
    tagsJson: JSON.stringify(input.tags),
    storageKey: stored.storageKey,
    publicUrl: stored.publicUrl,
    contentType: input.contentType,
    sizeBytes: input.bytes.byteLength,
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
  };
  try {
    db.insert(referenceImages).values(row).run();
    await persistDatabase();
  } catch (error) {
    console.error("Reference metadata persistence failed after storage upload", {
      referenceId: id,
      storageKey: stored.storageKey,
      error,
    });
    throw error;
  }
  return { ...row, categorySlug: category.slug, categoryLabel: category.label, tags: input.tags, url: row.publicUrl };
}
