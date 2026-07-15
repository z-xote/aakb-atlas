import { z } from "zod";

import {
  budgetRanges,
  clockPositions,
  fileAssetOrigins,
  jobTypes,
  projectTypes,
  relationshipStatuses,
  workflowStages,
} from "@/types/atlas";

export const MAX_FILE_ASSET_BYTES = 12 * 1024 * 1024;
const imageExtensions = new Set(["jpg", "jpeg", "png", "webp", "heic", "heif"]);

export const fileFormSchema = z.object({
  title: z.string().trim().min(1),
  relationshipStatus: z.enum(relationshipStatuses),
  workflowStage: z.enum(workflowStages),
  projectType: z.enum(projectTypes),
  budgetRange: z.enum(budgetRanges),
  jobType: z.enum(jobTypes),
  leadSource: z.string().trim(),
  contactName: z.string().trim().min(1),
  contactEmail: z.string().trim(),
  contactPhone: z.string().trim(),
  note: z.string().trim(),
});

const optionalRoom = z.string().trim().max(80).nullable();

export const fileAssetUploadFieldsSchema = z.object({
  label: z.string().trim().max(80),
  room: optionalRoom,
  origin: z.enum(fileAssetOrigins).refine((value) => value !== "generated"),
  cameraPositionClock: z.enum(clockPositions).nullable(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  retryAssetId: z.string().trim().min(1).nullable().default(null),
});

export const fileAssetMetadataSchema = z.object({
  label: z.string().trim().min(1).max(80),
  room: optionalRoom,
  cameraPositionClock: z.enum(clockPositions).nullable(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20),
});

export function parseAssetTags(value: string) {
  try {
    const parsed = JSON.parse(value);
    return z.array(z.string()).parse(parsed);
  } catch {
    return [];
  }
}

export function fileAssetContentType(file: { name: string; type: string }) {
  if (file.type.startsWith("image/")) return file.type;
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!imageExtensions.has(extension)) return null;
  return extension === "jpg" || extension === "jpeg" ? "image/jpeg" : `image/${extension}`;
}

export function fileCompletionRoute(fileId: string, intent: string) {
  return intent === "capture" ? `/files/${fileId}/images/capture` : `/files/${fileId}`;
}
