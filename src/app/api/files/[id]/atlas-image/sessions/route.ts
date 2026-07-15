import { createAtlasImageSession } from "@/features/atlas-image/data";
import { createAtlasImageSessionSchema } from "@/features/atlas-image/schemas";
import { ApiError, apiSuccess, parseJson, withApiErrors } from "@/services/api/response";
import { getAuthenticatedSession } from "@/services/auth/session";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApiErrors(async () => {
    if (!(await getAuthenticatedSession())) throw new ApiError(401, "unauthorized", "Unlock Atlas first.");
    const { id } = await params;
    const input = await parseJson(request, createAtlasImageSessionSchema);
    return apiSuccess(await createAtlasImageSession({ fileId: id, ...input }), { status: 201 });
  });
}
