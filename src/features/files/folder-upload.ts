import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";

import { folderAssetId } from "@/features/files/folder-asset-id";
import {
  fileAssetContentType,
  MAX_FILE_ASSET_BYTES,
  MAX_FILE_ASSET_LABEL_LENGTH,
} from "@/features/files/schemas";

export function selectFolderPhotos(files: File[]) {
  const photos: File[] = [];
  let skipped = 0;
  for (const file of files) {
    if (
      file.name.startsWith("._") ||
      !fileAssetContentType(file) ||
      file.size === 0 ||
      file.size > MAX_FILE_ASSET_BYTES
    ) {
      skipped += 1;
      continue;
    }
    photos.push(file);
  }
  return { photos, skipped };
}

export async function identifyFolderPhoto(fileId: string, file: File) {
  const uploadKey = bytesToHex(sha256(file.webkitRelativePath || file.name));
  const bytes = new Uint8Array(await file.arrayBuffer());
  return { uploadKey, assetId: folderAssetId(fileId, uploadKey, bytes) };
}

export async function uploadFolderPhoto(fileId: string, file: File, uploadKey: string) {
  const label = file.name.replace(/\.[^.]+$/, "").trim().slice(0, MAX_FILE_ASSET_LABEL_LENGTH).trimEnd();
  const form = new FormData();
  form.set("image", file, file.name);
  form.set("label", label || "Site photo");
  form.set("origin", "upload");
  form.set("uploadKey", uploadKey);

  try {
    const response = await fetch(`/api/files/${fileId}/assets`, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(180_000),
    });
    const result = await response.json().catch(() => null) as {
      ok: boolean;
      error?: { message?: string };
    } | null;
    if (response.ok && result?.ok) return null;
    return result?.error?.message ?? `Atlas could not upload this photo (HTTP ${response.status}).`;
  } catch {
    return "Atlas did not receive an upload confirmation. You can retry this photo.";
  }
}
