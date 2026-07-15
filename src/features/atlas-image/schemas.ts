import { z } from "zod";

export const createAtlasImageSessionSchema = z.object({
  sourceAssetId: z.string().min(1),
  parentGenerationId: z.string().min(1).nullable().optional(),
});

export const appendAtlasImageDirectionSchema = z.object({
  body: z.string().trim().min(1).max(4000),
});

export const setAtlasImageReferencesSchema = z.object({
  referenceIds: z.array(z.string().min(1)).max(20).refine(
    (ids) => new Set(ids).size === ids.length,
    "References cannot be selected twice."
  ),
});

export const generateAtlasImageSchema = z.object({
  sessionId: z.string().min(1),
  clientRequestId: z.string().min(8).max(200),
  quality: z.enum(["medium", "high"]).optional(),
});

export const retryAtlasImageSchema = z.object({
  clientRequestId: z.string().min(8).max(200),
});

export const MAX_TRANSCRIPTION_BYTES = 12 * 1024 * 1024;

export function transcriptionToComposerDraft(text: string) {
  return text.trim();
}
