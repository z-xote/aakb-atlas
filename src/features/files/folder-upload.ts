import {
  fileAssetContentType,
  MAX_FILE_ASSET_BYTES,
  MAX_FILE_ASSET_LABEL_LENGTH,
} from "@/features/files/schemas";

export type FolderPhoto = { file: File; uploadKey: string };

export function selectFolderPhotos(files: File[]) {
  const photos: FolderPhoto[] = [];
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
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    const uploadKey = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    photos.push({ file, uploadKey });
  }
  return { photos, skipped };
}

export async function uploadFolderPhoto(fileId: string, { file, uploadKey }: FolderPhoto) {
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
