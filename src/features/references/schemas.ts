import { z } from "zod";

import { ApiError } from "@/services/api/response";

export const MAX_REFERENCE_UPLOAD_BYTES = 12 * 1024 * 1024;

export const categoryCreateSchema = z.object({
  slug: z.string().trim().min(1).max(60).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  label: z.string().trim().min(1).max(80),
  sortOrder: z.coerce.number().int().min(0).max(10_000).default(0),
});

export const referenceUploadFieldsSchema = z.object({
  category: z.string().trim().min(1).max(80),
  label: z.string().trim().min(1).max(120),
  tags: z.string().trim().max(500).default(""),
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
export async function readReferenceForm(form: FormData) {
  const fields = referenceUploadFieldsSchema.parse({
    category: form.get("category"),
    label: form.get("label"),
    tags: form.get("tags") ?? "",
  });
  const image = form.get("image");
  let upload: ReferenceImageInput | null = null;
  if (image instanceof File && image.size > 0) {
    if (!image.type.startsWith("image/")) {
      throw new ApiError(400, "invalid_image_type", "The uploaded reference must be an image.");
    }
    if (image.size > MAX_REFERENCE_UPLOAD_BYTES) {
      throw new ApiError(413, "image_too_large", "Reference images must be 12 MB or smaller.");
    }
    upload = { filename: image.name, contentType: image.type, bytes: new Uint8Array(await image.arrayBuffer()) };
  }
  return { ...fields, tags: parseTags(fields.tags), image: upload };
}

export async function readReferenceUploadForm(form: FormData) {
  const { image, ...fields } = await readReferenceForm(form);
  if (!image) throw new ApiError(400, "image_required", "A reference image file is required.");
  return { ...fields, ...image };
}
