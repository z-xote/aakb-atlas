import { ApiError, apiSuccess, withApiErrors } from "@/services/api/response";
import { deleteReferenceImage, listReferenceCatalog, updateReferenceImage } from "@/features/references/data";
import { readReferenceEditForm } from "@/features/references/schemas";
import { requireCliAdmin } from "@/services/auth/admin";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  return withApiErrors(async () => {
    requireCliAdmin(request);
    const { id } = await context.params;
    const image = (await listReferenceCatalog()).images.find((item) => item.id === id);
    if (!image) throw new ApiError(404, "reference_not_found", "No reference matches that ID.");
    return apiSuccess(image);
  });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  return withApiErrors(async () => {
    requireCliAdmin(request);
    const { id } = await context.params;
    return apiSuccess(await deleteReferenceImage(id));
  });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return withApiErrors(async () => {
    requireCliAdmin(request);
    const { id } = await context.params;
    return apiSuccess(await updateReferenceImage(id, await readReferenceEditForm(await request.formData())));
  });
}
