import { createContinuationSession } from "@/features/atlas-image/data";
import { ApiError, apiSuccess, withApiErrors } from "@/services/api/response";
import { getAuthenticatedSession } from "@/services/auth/session";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string; generationId: string }> }) {
  return withApiErrors(async () => {
    if (!(await getAuthenticatedSession())) throw new ApiError(401, "unauthorized", "Unlock Atlas first.");
    const { id, generationId } = await params;
    return apiSuccess(await createContinuationSession(id, generationId), { status: 201 });
  });
}
