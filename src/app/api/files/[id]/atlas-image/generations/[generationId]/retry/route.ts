import { retryAtlasImageGeneration } from "@/features/atlas-image/data";
import { retryAtlasImageSchema } from "@/features/atlas-image/schemas";
import { ApiError, apiSuccess, parseJson, withApiErrors } from "@/services/api/response";
import { getAuthenticatedSession } from "@/services/auth/session";

export async function POST(request: Request, { params }: { params: Promise<{ id: string; generationId: string }> }) {
  return withApiErrors(async () => {
    if (!(await getAuthenticatedSession())) throw new ApiError(401, "unauthorized", "Unlock Atlas first.");
    const { id, generationId } = await params;
    const { clientRequestId } = await parseJson(request, retryAtlasImageSchema);
    return apiSuccess(await retryAtlasImageGeneration(id, generationId, clientRequestId), { status: 201 });
  });
}
