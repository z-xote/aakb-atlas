"use server";

import fs from "node:fs/promises";
import path from "node:path";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  fileImageKindLabels,
  fileImageKinds,
  type FileImageKind,
} from "@/types/atlas";
import { fileCompletionRoute, fileFormSchema } from "@/features/files/schemas";
import { requireAuth } from "@/services/auth/session";
import {
  addFileAsset,
  appendFileNote,
  createFile,
  deleteFile,
  updateFile,
} from "@/features/files/data";

const noteSchema = z.object({
  body: z.string().trim().min(1),
});

const imageKindSchema = z.enum(fileImageKinds);
const imageLabelSchema = z.string().trim().max(80);
const maxImageUploadSize = 12 * 1024 * 1024;

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function parseFileForm(formData: FormData) {
  return fileFormSchema.parse({
    title: text(formData, "title"),
    relationshipStatus: text(formData, "relationshipStatus"),
    workflowStage: text(formData, "workflowStage"),
    projectType: text(formData, "projectType"),
    budgetRange: text(formData, "budgetRange"),
    jobType: text(formData, "jobType"),
    leadSource: text(formData, "leadSource"),
    contactName: text(formData, "contactName"),
    contactEmail: text(formData, "contactEmail"),
    contactPhone: text(formData, "contactPhone"),
    note: text(formData, "note"),
  });
}

function isUploadFile(value: FormDataEntryValue | null): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    "arrayBuffer" in value &&
    "name" in value &&
    "size" in value &&
    "type" in value
  );
}

function safeFilename(name: string) {
  return name
    .trim()
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 90);
}

export async function createFileAction(formData: FormData) {
  await requireAuth();
  const id = await createFile(parseFileForm(formData));
  const completionIntent = text(formData, "completionIntent");

  revalidatePath("/files");
  redirect(fileCompletionRoute(id, completionIntent));
}

export async function updateFileAction(id: string, formData: FormData) {
  await requireAuth();
  await updateFile(id, parseFileForm(formData));

  revalidatePath("/files");
  revalidatePath(`/files/${id}`);
  redirect(`/files/${id}`);
}

export async function addFileNoteAction(id: string, formData: FormData) {
  await requireAuth();
  const { body } = noteSchema.parse({
    body: text(formData, "body"),
  });

  await appendFileNote(id, body);

  revalidatePath("/files");
  revalidatePath(`/files/${id}`);
}

export async function uploadFileImageAction(
  id: string,
  kind: FileImageKind,
  formData: FormData
) {
  await requireAuth();

  const parsedKind = imageKindSchema.parse(kind);
  const upload = formData.get("image");

  if (!isUploadFile(upload) || upload.size === 0) {
    return;
  }

  if (!upload.type.startsWith("image/")) {
    throw new Error("Only image uploads are supported.");
  }

  if (upload.size > maxImageUploadSize) {
    throw new Error("Image uploads must be 12MB or smaller.");
  }

  const label = imageLabelSchema.parse(text(formData, "label"));
  const filename = `${Date.now()}-${safeFilename(upload.name || "image")}`;
  const relativePath = `/uploads/atlas/files/${id}/${parsedKind}/${filename}`;
  const absolutePath = path.join(process.cwd(), "public", relativePath);

  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, Buffer.from(await upload.arrayBuffer()));
  await addFileAsset(id, {
    kind: parsedKind,
    label: label || upload.name || fileImageKindLabels[parsedKind],
    url: relativePath,
    storageKey: `public${relativePath}`,
  });

  revalidatePath("/files");
  revalidatePath(`/files/${id}`);
}

export async function deleteFileAction(id: string) {
  await requireAuth();
  await deleteFile(id);

  revalidatePath("/files");
  redirect("/files");
}
