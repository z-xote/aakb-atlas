import { randomUUID } from "node:crypto";
import { asc, count, eq, max } from "drizzle-orm";

import { getDb, persistDatabase } from "@/db/client";
import { atlasImageSessionReferences, referenceCategories, referenceImages } from "@/db/schema";
import { categorySlug, type ReferenceImageInput } from "@/features/references/schemas";
import { ApiError } from "@/services/api/response";
import { deleteStoredObject, uploadStoredObject, type StoredObject } from "@/services/bunny/client";

export type ReferenceObjectWriter = (input: {
  objectPath: string;
  bytes: Uint8Array;
  contentType: string;
}) => Promise<StoredObject>;

export type ReferenceObjectRemover = (storageKey: string) => Promise<void>;

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

async function findCategory(slug: string) {
  const db = await getDb();
  const category = db.select().from(referenceCategories).where(eq(referenceCategories.slug, slug)).get();
  if (!category) throw new ApiError(404, "category_not_found", "No reference category matches that slug.");
  return category;
}

function storeReferenceObject(categoryId: string, objectName: string, image: ReferenceImageInput, storeObject: ReferenceObjectWriter) {
  const extension = image.filename.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "bin";
  return storeObject({
    objectPath: `references/${categoryId}/${objectName}.${extension}`,
    bytes: image.bytes,
    contentType: image.contentType,
  });
}

async function removeOrLog(referenceId: string, storageKey: string, removeObject: ReferenceObjectRemover) {
  try {
    await removeObject(storageKey);
    return true;
  } catch (error) {
    console.error("Reference object removal failed after metadata change", { referenceId, storageKey, error });
    return false;
  }
}

// Slug and position come from the label so the UI only asks for a name.
export async function addReferenceCategory(label: string) {
  const slug = categorySlug(label);
  if (!slug) throw new ApiError(400, "invalid_category", "Use letters or numbers in the category name.");
  const db = await getDb();
  const [{ last }] = db.select({ last: max(referenceCategories.sortOrder) }).from(referenceCategories).all();
  return createReferenceCategory({ slug, label, sortOrder: (last ?? -1) + 1 });
}

export async function uploadReferenceImage(input: {
  category: string;
  label: string;
  tags: string[];
  createdBy: string;
} & ReferenceImageInput, storeObject: ReferenceObjectWriter = uploadStoredObject) {
  const db = await getDb();
  const category = await findCategory(input.category);
  const id = `reference_${randomUUID()}`;
  const stored = await storeReferenceObject(category.id, id, input, storeObject);
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

// A new image gets a new object key, so the old object is removed only after the row points away from it.
type AtlasDb = Awaited<ReturnType<typeof getDb>>;

// A category disappears with its last reference. Categories that were never used stay.
function dropCategoryIfEmpty(db: AtlasDb, categoryId: string) {
  const [{ remaining }] = db.select({ remaining: count() }).from(referenceImages).where(eq(referenceImages.categoryId, categoryId)).all();
  if (remaining > 0) return false;
  db.delete(referenceCategories).where(eq(referenceCategories.id, categoryId)).run();
  return true;
}

export async function renameReferenceCategory(slug: string, label: string) {
  const db = await getDb();
  const category = await findCategory(slug);
  const nextSlug = categorySlug(label);
  if (!nextSlug) throw new ApiError(400, "invalid_category", "Use letters or numbers in the category name.");
  if (nextSlug !== category.slug && db.select({ id: referenceCategories.id }).from(referenceCategories).where(eq(referenceCategories.slug, nextSlug)).get()) {
    throw new ApiError(409, "category_exists", "A reference category with that name already exists.");
  }
  const changes = { slug: nextSlug, label, updatedAt: Date.now() };
  db.update(referenceCategories).set(changes).where(eq(referenceCategories.id, category.id)).run();
  await persistDatabase();
  return { ...category, ...changes };
}

// Omitted fields keep their current value, so the CLI can change one field at a time.
// A new image gets a new object key, so the old object is removed only after the row points away from it.
export async function updateReferenceImage(id: string, input: {
  category?: string;
  label?: string;
  tags?: string[];
  image: ReferenceImageInput | null;
}, storeObject: ReferenceObjectWriter = uploadStoredObject, removeObject: ReferenceObjectRemover = deleteStoredObject) {
  const db = await getDb();
  const current = db.select().from(referenceImages).where(eq(referenceImages.id, id)).get();
  if (!current) throw new ApiError(404, "reference_not_found", "No reference matches that ID.");
  const category = input.category
    ? await findCategory(input.category)
    : db.select().from(referenceCategories).where(eq(referenceCategories.id, current.categoryId)).get()!;
  const stored = input.image ? await storeReferenceObject(category.id, `${id}-${Date.now()}`, input.image, storeObject) : null;
  const changes = {
    categoryId: category.id,
    label: input.label ?? current.label,
    tagsJson: input.tags ? JSON.stringify(input.tags) : current.tagsJson,
    updatedAt: Date.now(),
    ...(stored && input.image ? {
      storageKey: stored.storageKey,
      publicUrl: stored.publicUrl,
      contentType: input.image.contentType,
      sizeBytes: input.image.bytes.byteLength,
    } : {}),
  };
  db.update(referenceImages).set(changes).where(eq(referenceImages.id, id)).run();
  const categoryRemoved = category.id !== current.categoryId && dropCategoryIfEmpty(db, current.categoryId);
  await persistDatabase();
  const storageRemoved = stored ? await removeOrLog(id, current.storageKey, removeObject) : true;
  return {
    id,
    label: changes.label,
    categorySlug: category.slug,
    tags: JSON.parse(changes.tagsJson) as string[],
    url: changes.publicUrl ?? current.publicUrl,
    storageRemoved,
    categoryRemoved,
  };
}

export async function deleteReferenceImage(id: string, removeObject: ReferenceObjectRemover = deleteStoredObject) {
  const db = await getDb();
  const image = db.select().from(referenceImages).where(eq(referenceImages.id, id)).get();
  if (!image) throw new ApiError(404, "reference_not_found", "No reference matches that ID.");

  const [{ sessions }] = db
    .select({ sessions: count() })
    .from(atlasImageSessionReferences)
    .where(eq(atlasImageSessionReferences.referenceId, id))
    .all();
  if (sessions > 0) {
    throw new ApiError(
      409,
      "reference_in_use",
      `“${image.label}” is used by ${sessions} Atlas image ${sessions === 1 ? "session" : "sessions"}. Remove it from ${sessions === 1 ? "that session" : "those sessions"} before deleting it.`,
      { sessions }
    );
  }

  db.delete(referenceImages).where(eq(referenceImages.id, id)).run();
  const categoryRemoved = dropCategoryIfEmpty(db, image.categoryId);
  await persistDatabase();
  // The row is gone first so a storage failure leaves an orphaned object, never a broken card.
  return { id, label: image.label, storageRemoved: await removeOrLog(id, image.storageKey, removeObject), categoryRemoved };
}
