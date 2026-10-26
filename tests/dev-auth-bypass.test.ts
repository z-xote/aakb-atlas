import { describe, expect, test } from "bun:test";

import { DEV_SESSION, isDevAuthBypassActive } from "@/services/auth/dev-bypass";

describe("Dev login bypass", () => {
  test("is on when the flag is set in development", () => {
    expect(isDevAuthBypassActive({ NODE_ENV: "development", ATLAS_DEV_AUTH_BYPASS: true })).toBe(true);
  });

  test("is off without the flag", () => {
    expect(isDevAuthBypassActive({ NODE_ENV: "development", ATLAS_DEV_AUTH_BYPASS: false })).toBe(false);
  });

  test("is never on in production, even with the flag set", () => {
    expect(isDevAuthBypassActive({ NODE_ENV: "production", ATLAS_DEV_AUTH_BYPASS: true })).toBe(false);
    expect(isDevAuthBypassActive({ NODE_ENV: "production", ATLAS_DEV_AUTH_BYPASS: false })).toBe(false);
  });

  test("returns a fixed active session for the dev@local actor", () => {
    expect(DEV_SESSION.device.deviceName).toBe("dev@local");
    expect(DEV_SESSION.device.status).toBe("active");
    expect(DEV_SESSION.session.deviceId).toBe(DEV_SESSION.device.id);
  });
});
