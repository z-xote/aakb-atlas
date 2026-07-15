import fs from "node:fs/promises";
import path from "node:path";

import { ApiError } from "@/services/api/response";
import { getBunnyEnv } from "@/services/bunny/env";

export type StoredObject = { storageKey: string; publicUrl: string };

function cleanObjectPath(value: string) {
  return value.split("/").map((part) => part.replace(/[^a-zA-Z0-9._-]/g, "-")).join("/");
}

function encodeObjectPath(value: string) {
  return value.split("/").map((part) => encodeURIComponent(part)).join("/");
}

function withStoragePrefix(prefix: string, objectPath: string) {
  return [prefix, cleanObjectPath(objectPath)].filter(Boolean).join("/");
}

export async function uploadStoredObject(input: {
  objectPath: string;
  bytes: Uint8Array;
  contentType: string;
}): Promise<StoredObject> {
  const env = getBunnyEnv();
  const storageKey = withStoragePrefix(env.prefix, input.objectPath);

  if (env.driver === "local") {
    const relative = `/uploads/atlas-storage/${storageKey}`;
    const absolute = path.join(process.cwd(), "public", relative);
    await fs.mkdir(path.dirname(absolute), { recursive: true });
    await fs.writeFile(absolute, input.bytes);
    return { storageKey, publicUrl: relative };
  }

  if (!env.configured || !env.storageZone || !env.accessKey || !env.cdnHostname) {
    throw new ApiError(503, "bunny_not_configured", "Bunny storage is not configured on the Atlas server.");
  }
  const target = `${env.storageEndpoint}/${encodeURIComponent(env.storageZone)}/${encodeObjectPath(storageKey)}`;
  const response = await fetch(target, {
    method: "PUT",
    headers: { AccessKey: env.accessKey, "content-type": input.contentType },
    body: new Blob([new Uint8Array(input.bytes)]),
  });
  if (!response.ok) {
    const providerMessage = (await response.text()).trim().slice(0, 500);
    throw new ApiError(502, "bunny_upload_failed", "Bunny did not accept the uploaded bytes.", {
      status: response.status,
      storageKey,
      ...(providerMessage ? { providerMessage } : {}),
    });
  }
  return {
    storageKey,
    publicUrl: `https://${env.cdnHostname.replace(/^https?:\/\//, "").replace(/\/$/, "")}/${encodeObjectPath(storageKey)}`,
  };
}

export function createBunnyUploadSlot(input: { fileId: string; filename: string }) {
  const env = getBunnyEnv();
  const safeName = input.filename.replace(/[^a-zA-Z0-9._-]/g, "-");
  const objectPath = withStoragePrefix(env.prefix, `files/${input.fileId}/assets/${safeName}`);
  return {
    configured: env.driver === "local" || env.configured,
    objectPath,
    publicUrl: env.driver === "local"
      ? `/uploads/atlas-storage/${objectPath}`
      : env.cdnHostname
        ? `https://${env.cdnHostname}/${encodeObjectPath(objectPath)}`
        : null,
  };
}
