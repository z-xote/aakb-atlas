import { env } from "@/services/env";

export function getBunnyEnv() {
  return {
    storageZone: env.BUNNY_STORAGE_ZONE,
    accessKey: env.BUNNY_ACCESS_KEY,
    cdnHostname: env.BUNNY_CDN_HOSTNAME,
    configured: Boolean(
      env.BUNNY_STORAGE_ZONE && env.BUNNY_ACCESS_KEY && env.BUNNY_CDN_HOSTNAME
    ),
  };
}
