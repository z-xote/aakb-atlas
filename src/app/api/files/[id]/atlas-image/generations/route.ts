import { runAtlasImageGeneration } from "@/features/atlas-image/data";
import { generateAtlasImageSchema } from "@/features/atlas-image/schemas";
import { ApiError, apiSuccess, parseJson, withApiErrors } from "@/services/api/response";
import { getAuthenticatedSession } from "@/services/auth/session";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApiErrors(async () => {
    if (!(await getAuthenticatedSession())) throw new ApiError(401, "unauthorized", "Unlock Atlas first.");
    const { id } = await params;
    const input = await parseJson(request, generateAtlasImageSchema);
    return apiSuccess(await runAtlasImageGeneration({ fileId: id, ...input }), { status: 201 });
  });
}
