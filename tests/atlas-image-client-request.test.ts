import { afterEach, describe, expect, test } from "bun:test";

import {
  createClientRequestId,
  generationFailureMessage,
  readGenerationResponse,
} from "@/features/atlas-image/client-request";

const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const randomUUID = crypto.randomUUID;

afterEach(() => {
  Object.defineProperty(crypto, "randomUUID", { value: randomUUID, configurable: true, writable: true });
});

describe("createClientRequestId", () => {
  test("uses crypto.randomUUID when the page is a secure context", () => {
    expect(createClientRequestId()).toMatch(uuidV4);
  });

  test("still returns a v4 UUID on a plain-http page without randomUUID", () => {
    Object.defineProperty(crypto, "randomUUID", { value: undefined, configurable: true, writable: true });
    const first = createClientRequestId();
    expect(first).toMatch(uuidV4);
    expect(createClientRequestId()).not.toBe(first);
  });
});

describe("generation responses", () => {
  test("reads a JSON body", async () => {
    const response = Response.json({ ok: true, data: { id: "aig_1" } }, { status: 201 });
    expect(await readGenerationResponse(response)).toEqual({ ok: true, data: { id: "aig_1" } });
  });

  test("returns null for a proxy's HTML timeout page", async () => {
    const response = new Response("<html>504 Gateway Time-out</html>", { status: 504 });
    expect(await readGenerationResponse(response)).toBeNull();
  });

  test("prefers the server's own error message", () => {
    const response = new Response(null, { status: 400 });
    expect(generationFailureMessage(response, { ok: false, error: { message: "Add a direction first." } })).toBe("Add a direction first.");
  });

  test("tells the user a timed-out generation may still finish", () => {
    for (const status of [502, 504, 524]) {
      expect(generationFailureMessage(new Response(null, { status }), null)).toContain("may still finish");
    }
  });

  test("names the HTTP status for any other failure", () => {
    expect(generationFailureMessage(new Response(null, { status: 500 }), null)).toBe("Atlas could not start generation (HTTP 500).");
  });
});
