import { ApiError, apiSuccess, withApiErrors } from "@/services/api/response";
import { deleteReferenceImage } from "@/features/references/data";
import { getAuthenticatedSession } from "@/services/auth/session";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApiErrors(async () => {
    if (!(await getAuthenticatedSession())) throw new ApiError(401, "unauthorized", "Unlock Atlas to delete references.");
    const { id } = await params;
    return apiSuccess(await deleteReferenceImage(id));
  });
}
