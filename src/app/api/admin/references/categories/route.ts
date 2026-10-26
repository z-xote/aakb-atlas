import { apiSuccess, parseJson, withApiErrors } from "@/services/api/response";
import { addReferenceCategory, createReferenceCategory, listReferenceCatalog } from "@/features/references/data";
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
    const { slug, label, sortOrder } = await parseJson(request, categoryCreateSchema);
    const row = slug ? await createReferenceCategory({ slug, label, sortOrder: sortOrder ?? 0 }) : await addReferenceCategory(label);
    return apiSuccess(row, { status: 201 });
  });
}
