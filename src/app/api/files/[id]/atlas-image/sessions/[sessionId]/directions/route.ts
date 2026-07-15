import { appendAtlasImageDirection } from "@/features/atlas-image/data";
import { appendAtlasImageDirectionSchema } from "@/features/atlas-image/schemas";
import { ApiError, apiSuccess, parseJson, withApiErrors } from "@/services/api/response";
import { getAuthenticatedSession } from "@/services/auth/session";

export async function POST(request: Request, { params }: { params: Promise<{ id: string; sessionId: string }> }) {
  return withApiErrors(async () => {
    if (!(await getAuthenticatedSession())) throw new ApiError(401, "unauthorized", "Unlock Atlas first.");
    const { id, sessionId } = await params;
    const { body } = await parseJson(request, appendAtlasImageDirectionSchema);
    return apiSuccess(await appendAtlasImageDirection(id, sessionId, body), { status: 201 });
  });
}
