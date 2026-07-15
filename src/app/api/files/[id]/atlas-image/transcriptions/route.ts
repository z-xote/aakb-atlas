import { MAX_TRANSCRIPTION_BYTES } from "@/features/atlas-image/schemas";
import { ApiError, apiSuccess, withApiErrors } from "@/services/api/response";
import { getAuthenticatedSession } from "@/services/auth/session";
import { AtlasProviderError, openAIAtlasProvider } from "@/services/openai/client";

export async function POST(request: Request) {
  return withApiErrors(async () => {
    if (!(await getAuthenticatedSession())) throw new ApiError(401, "unauthorized", "Unlock Atlas first.");
    const form = await request.formData();
    const audio = form.get("audio");
    if (!(audio instanceof File) || audio.size === 0) {
      throw new ApiError(400, "audio_required", "Record a short direction first.");
    }
    if (audio.size > MAX_TRANSCRIPTION_BYTES) {
      throw new ApiError(413, "audio_too_large", "Voice directions must be 12 MB or smaller.");
    }
    try {
      const text = await openAIAtlasProvider.transcribe({
        bytes: new Uint8Array(await audio.arrayBuffer()),
        contentType: audio.type || "audio/webm",
        filename: audio.name || "direction.webm",
      });
      return apiSuccess({ text });
    } catch (error) {
      if (error instanceof AtlasProviderError) {
        const blocked = error.httpStatus === 401 || error.httpStatus === 403;
        throw new ApiError(blocked ? 409 : 502, blocked ? "transcription_blocked" : "transcription_failed", error.message);
      }
      throw error;
    }
  });
}
