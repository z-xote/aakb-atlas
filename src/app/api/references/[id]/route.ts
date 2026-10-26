import { ApiError, apiSuccess, withApiErrors } from "@/services/api/response";
import { deleteReferenceImage, updateReferenceImage } from "@/features/references/data";
import { readReferenceForm } from "@/features/references/schemas";
import { getAuthenticatedSession } from "@/services/auth/session";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  return withApiErrors(async () => {
    if (!(await getAuthenticatedSession())) throw new ApiError(401, "unauthorized", "Unlock Atlas to edit references.");
    const { id } = await params;
    return apiSuccess(await updateReferenceImage(id, await readReferenceForm(await request.formData())));
  });
}

export async function DELETE(_request: Request, { params }: Context) {
  return withApiErrors(async () => {
    if (!(await getAuthenticatedSession())) throw new ApiError(401, "unauthorized", "Unlock Atlas to delete references.");
    const { id } = await params;
    return apiSuccess(await deleteReferenceImage(id));
  });
}
