import type { AtlasImageQuality } from "@/types/atlas";

import { getOpenAIEnv } from "@/services/openai/env";

export type ProviderImageInput = {
  bytes: Uint8Array;
  contentType: string;
  filename: string;
};

export type AtlasImageEditInput = {
  prompt: string;
  quality: AtlasImageQuality;
  images: ProviderImageInput[];
};

export type AtlasImageEditResult = {
  bytes: Uint8Array;
  contentType: string;
  providerRequestId: string | null;
};

export class AtlasProviderError extends Error {
  constructor(
    message: string,
    public readonly httpStatus?: number,
    public readonly providerCode?: string
  ) {
    super(message);
  }
}

function blobBytes(bytes: Uint8Array) {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

async function providerFailure(response: Response) {
  let message = `OpenAI returned HTTP ${response.status}.`;
  let code: string | undefined;
  try {
    const body = (await response.json()) as {
      error?: { message?: string; code?: string };
    };
    message = body.error?.message || message;
    code = body.error?.code;
  } catch {
    // The HTTP status remains enough to classify an unstructured provider error.
  }
  return new AtlasProviderError(message, response.status, code);
}

export const openAIAtlasProvider = {
  async edit(input: AtlasImageEditInput): Promise<AtlasImageEditResult> {
    const { apiKey } = getOpenAIEnv();
    if (!apiKey) {
      throw new AtlasProviderError("OPENAI_API_KEY is not configured.", 403, "api_key_missing");
    }
    if (input.images.length === 0) {
      throw new AtlasProviderError("A structural source image is required.", 400, "source_required");
    }

    const form = new FormData();
    form.set("model", "gpt-image-2");
    form.set("prompt", input.prompt);
    form.set("quality", input.quality);
    form.set("n", "1");
    form.set("output_format", "png");
    input.images.forEach((image) => {
      form.append(
        "image[]",
        new Blob([blobBytes(image.bytes)], { type: image.contentType }),
        image.filename
      );
    });

    let response: Response;
    try {
      response = await fetch("https://api.openai.com/v1/images/edits", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new AtlasProviderError("The generation was cancelled.", 499, "cancelled");
      }
      throw new AtlasProviderError("Atlas could not reach OpenAI.", 503, "provider_network_error");
    }
    if (!response.ok) throw await providerFailure(response);

    const body = (await response.json()) as { data?: Array<{ b64_json?: string }> };
    const encoded = body.data?.[0]?.b64_json;
    if (!encoded) {
      throw new AtlasProviderError("OpenAI returned no image bytes.", 502, "empty_image_output");
    }
    return {
      bytes: Uint8Array.from(Buffer.from(encoded, "base64")),
      contentType: "image/png",
      providerRequestId: response.headers.get("x-request-id"),
    };
  },

  async transcribe(file: ProviderImageInput) {
    const { apiKey } = getOpenAIEnv();
    if (!apiKey) {
      throw new AtlasProviderError("OPENAI_API_KEY is not configured.", 403, "api_key_missing");
    }
    const form = new FormData();
    form.set("model", "gpt-4o-mini-transcribe");
    form.set("file", new Blob([blobBytes(file.bytes)], { type: file.contentType }), file.filename);
    let response: Response;
    try {
      response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
      });
    } catch {
      throw new AtlasProviderError("Atlas could not reach OpenAI transcription.", 503, "provider_network_error");
    }
    if (!response.ok) throw await providerFailure(response);
    const body = (await response.json()) as { text?: string };
    if (!body.text?.trim()) {
      throw new AtlasProviderError("OpenAI returned an empty transcript.", 502, "empty_transcript");
    }
    return body.text.trim();
  },
};
