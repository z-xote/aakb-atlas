import { getBunnyEnv } from "@/services/bunny/env";

export type BunnyUploadSlot = {
  configured: boolean;
  objectPath: string;
  publicUrl: string | null;
};

export function createBunnyUploadSlot(input: {
  fileId: string;
  filename: string;
}): BunnyUploadSlot {
  const env = getBunnyEnv();
  const safeName = input.filename.replace(/[^a-zA-Z0-9._-]/g, "-");
  const objectPath = `files/${input.fileId}/assets/${safeName}`;

  return {
    configured: env.configured,
    objectPath,
    publicUrl: env.cdnHostname ? `https://${env.cdnHostname}/${objectPath}` : null,
  };
}
