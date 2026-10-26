import { apiSuccess, parseJson, withApiErrors } from "@/services/api/response";
import { renameReferenceCategory } from "@/features/references/data";
import { categoryLabelSchema } from "@/features/references/schemas";
import { requireCliAdmin } from "@/services/auth/admin";

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  return withApiErrors(async () => {
    requireCliAdmin(request);
    const { slug } = await params;
    const { label } = await parseJson(request, categoryLabelSchema);
    return apiSuccess(await renameReferenceCategory(slug, label));
  });
}
