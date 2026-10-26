import { z } from "zod";

import { ApiError } from "@/services/api/response";

export const MAX_REFERENCE_UPLOAD_BYTES = 12 * 1024 * 1024;

// Slug and sort order are optional; without a slug Atlas derives both from the label, as the UI does.
export const categoryCreateSchema = z.object({
  slug: z.string().trim().min(1).max(60).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  label: z.string().trim().min(1).max(80),
  sortOrder: z.coerce.number().int().min(0).max(10_000).optional(),
});

export const referenceUploadFieldsSchema = z.object({
  category: z.string().trim().min(1).max(80),
  label: z.string().trim().min(1).max(120),
  tags: z.string().trim().max(500).default(""),
});

// No default on tags: an absent field keeps the current tags.
export const referenceEditFieldsSchema = z.object({
  category: z.string().trim().min(1).max(80).optional(),
  label: z.string().trim().min(1).max(120).optional(),
  tags: z.string().trim().max(500).optional(),
});

export function parseTags(value: string) {
  return [...new Set(value.split(",").map((tag) => tag.trim()).filter(Boolean))].slice(0, 30);
}

export const categoryLabelSchema = z.object({ label: z.string().trim().min(1).max(80) });

export function categorySlug(label: string) {
  return label.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

export type ReferenceImageInput = { filename: string; contentType: string; bytes: Uint8Array };

// Shared by every reference form route so all of them apply the same limits.
async function readReferenceImage(form: FormData): Promise<ReferenceImageInput | null> {
  const image = form.get("image");
  if (!(image instanceof File) || image.size === 0) return null;
  if (!image.type.startsWith("image/")) {
    throw new ApiError(400, "invalid_image_type", "The uploaded reference must be an image.");
  }
  if (image.size > MAX_REFERENCE_UPLOAD_BYTES) {
    throw new ApiError(413, "image_too_large", "Reference images must be 12 MB or smaller.");
  }
  return { filename: image.name, contentType: image.type, bytes: new Uint8Array(await image.arrayBuffer()) };
}

export async function readReferenceUploadForm(form: FormData) {
  const fields = referenceUploadFieldsSchema.parse({
    category: form.get("category"),
    label: form.get("label"),
    tags: form.get("tags") ?? "",
  });
  const image = await readReferenceImage(form);
  if (!image) throw new ApiError(400, "image_required", "A reference image file is required.");
  return { ...fields, tags: parseTags(fields.tags), ...image };
}

// Edits send only the fields that change. A present but empty tags field clears the tags.
export async function readReferenceEditForm(form: FormData) {
  const fields = referenceEditFieldsSchema.parse({
    category: form.get("category") ?? undefined,
    label: form.get("label") ?? undefined,
    tags: form.get("tags") ?? undefined,
  });
  return {
    category: fields.category,
    label: fields.label,
    tags: fields.tags === undefined ? undefined : parseTags(fields.tags),
    image: await readReferenceImage(form),
  };
}
