import { ApiError, apiSuccess, parseJson, withApiErrors } from "@/services/api/response";
import { addReferenceCategory, listReferenceCatalog } from "@/features/references/data";
import { categoryLabelSchema } from "@/features/references/schemas";
import { getAuthenticatedSession } from "@/services/auth/session";

export async function GET() {
  return withApiErrors(async () => {
    if (!(await getAuthenticatedSession())) throw new ApiError(401, "unauthorized", "Unlock Atlas to browse references.");
    return apiSuccess((await listReferenceCatalog()).categories);
  });
}

export async function POST(request: Request) {
  return withApiErrors(async () => {
    if (!(await getAuthenticatedSession())) throw new ApiError(401, "unauthorized", "Unlock Atlas to add categories.");
    const { label } = await parseJson(request, categoryLabelSchema);
    return apiSuccess(await addReferenceCategory(label), { status: 201 });
  });
}
