import type { devices, deviceSessions } from "@/db/schema";
import { env } from "@/services/env";

type BypassConfig = Pick<typeof env, "NODE_ENV" | "ATLAS_DEV_AUTH_BYPASS">;

// Opt-in local login skip. Production ignores the flag.
export function isDevAuthBypassActive(config: BypassConfig = env) {
  return config.ATLAS_DEV_AUTH_BYPASS && config.NODE_ENV !== "production";
}

const DEV_DEVICE_ID = "dev-local";

// Shaped like a findActiveSession() row so callers need no special case.
export const DEV_SESSION: {
  session: typeof deviceSessions.$inferSelect;
  device: typeof devices.$inferSelect;
} = {
  session: {
    id: "dev-local-session",
    tokenHash: "",
    deviceId: DEV_DEVICE_ID,
    lastActivityAt: 0,
    expiresAt: Number.MAX_SAFE_INTEGER,
    revokedAt: null,
    createdAt: 0,
  },
  device: {
    id: DEV_DEVICE_ID,
    deviceName: "dev@local",
    publicKey: "",
    fingerprint: "dev@local",
    status: "active",
    pinHash: null,
    pinSalt: null,
    pinResetRequired: false,
    failedAttemptCount: 0,
    firstFailedAt: null,
    lockedUntil: null,
    createdAt: 0,
    updatedAt: 0,
  },
};
