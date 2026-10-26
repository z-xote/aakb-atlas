import { ApiError, apiSuccess, parseJson, withApiErrors } from "@/services/api/response";
import { renameReferenceCategory } from "@/features/references/data";
import { categoryLabelSchema } from "@/features/references/schemas";
import { getAuthenticatedSession } from "@/services/auth/session";

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  return withApiErrors(async () => {
    if (!(await getAuthenticatedSession())) throw new ApiError(401, "unauthorized", "Unlock Atlas to rename categories.");
    const { slug } = await params;
    const { label } = await parseJson(request, categoryLabelSchema);
    return apiSuccess(await renameReferenceCategory(slug, label));
  });
}
