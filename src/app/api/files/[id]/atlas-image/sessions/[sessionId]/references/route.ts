import { setAtlasImageReferences } from "@/features/atlas-image/data";
import { setAtlasImageReferencesSchema } from "@/features/atlas-image/schemas";
import { ApiError, apiSuccess, parseJson, withApiErrors } from "@/services/api/response";
import { getAuthenticatedSession } from "@/services/auth/session";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string; sessionId: string }> }) {
  return withApiErrors(async () => {
    if (!(await getAuthenticatedSession())) throw new ApiError(401, "unauthorized", "Unlock Atlas first.");
    const { id, sessionId } = await params;
    const { referenceIds } = await parseJson(request, setAtlasImageReferencesSchema);
    return apiSuccess(await setAtlasImageReferences(id, sessionId, referenceIds));
  });
}
