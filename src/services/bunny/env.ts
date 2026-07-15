import { env } from "@/services/env";

export function getBunnyEnv() {
  return {
    driver: env.ATLAS_STORAGE_DRIVER,
    prefix: env.ATLAS_STORAGE_PREFIX.trim().replace(/^\/+|\/+$/g, ""),
    storageZone: env.BUNNY_STORAGE_ZONE,
    accessKey: env.BUNNY_ACCESS_KEY,
    storageEndpoint: env.BUNNY_STORAGE_ENDPOINT.replace(/\/$/, ""),
    cdnHostname: env.BUNNY_CDN_HOSTNAME,
    configured: Boolean(
      env.BUNNY_STORAGE_ZONE && env.BUNNY_ACCESS_KEY && env.BUNNY_CDN_HOSTNAME
    ),
  };
}
