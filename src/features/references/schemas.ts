import { z } from "zod";

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
