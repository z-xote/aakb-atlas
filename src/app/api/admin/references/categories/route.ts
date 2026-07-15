import { apiSuccess, parseJson, withApiErrors } from "@/services/api/response";
import { createReferenceCategory, listReferenceCatalog } from "@/features/references/data";
import { categoryCreateSchema } from "@/features/references/schemas";
import { requireCliAdmin } from "@/services/auth/admin";

export async function GET(request: Request) {
  return withApiErrors(async () => {
    requireCliAdmin(request);
    return apiSuccess((await listReferenceCatalog()).categories);
  });
}

export async function POST(request: Request) {
  return withApiErrors(async () => {
    requireCliAdmin(request);
    return apiSuccess(await createReferenceCategory(await parseJson(request, categoryCreateSchema)), { status: 201 });
  });
}
