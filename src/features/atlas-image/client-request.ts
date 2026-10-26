// crypto.randomUUID() exists only in secure contexts (https, localhost). On a
// plain-http page it is undefined and throws before fetch runs, so build a v4
// UUID from getRandomValues(), which every context has.
export function createClientRequestId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export type GenerationResponse = {
  ok: boolean;
  data?: { id?: string };
  error?: { message?: string };
};

// A proxy timeout (nginx 504, Cloudflare 524) replaces the JSON with an HTML page.
export async function readGenerationResponse(response: Response): Promise<GenerationResponse | null> {
  try {
    return (await response.json()) as GenerationResponse;
  } catch {
    return null;
  }
}

const gatewayTimeouts = new Set([502, 504, 524]);

// Generation runs inside the request, so a proxy timeout does not stop it.
export function generationFailureMessage(response: Response, body: GenerationResponse | null) {
  if (body?.error?.message) return body.error.message;
  if (gatewayTimeouts.has(response.status)) {
    return "The connection timed out while Atlas was generating. The image may still finish, so check history in a minute before trying again.";
  }
  return `Atlas could not start generation (HTTP ${response.status}).`;
}
