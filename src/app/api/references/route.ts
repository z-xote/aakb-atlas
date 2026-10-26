import { ApiError, apiSuccess, withApiErrors } from "@/services/api/response";
import { sessionActor } from "@/features/references/actor";
import { listReferenceCatalog, uploadReferenceImage } from "@/features/references/data";
import { readReferenceUploadForm } from "@/features/references/schemas";
import { getAuthenticatedSession } from "@/services/auth/session";

export async function GET(request: Request) {
  return withApiErrors(async () => {
    if (!(await getAuthenticatedSession())) throw new ApiError(401, "unauthorized", "Unlock Atlas to browse references.");
    const url = new URL(request.url);
    const query = (url.searchParams.get("q") ?? "").trim().toLowerCase();
    const category = url.searchParams.get("category");
    const catalog = await listReferenceCatalog();
    const images = catalog.images.filter((image) =>
      (!category || image.categorySlug === category) &&
      (!query || [image.label, image.categoryLabel, ...image.tags].join(" ").toLowerCase().includes(query))
    );
    return apiSuccess({ categories: catalog.categories, images });
  });
}

export async function POST(request: Request) {
  return withApiErrors(async () => {
    const session = await getAuthenticatedSession();
    if (!session) throw new ApiError(401, "unauthorized", "Unlock Atlas to add references.");
    const upload = await readReferenceUploadForm(await request.formData());
    const result = await uploadReferenceImage({ ...upload, createdBy: sessionActor(session) });
    return apiSuccess(result, { status: 201 });
  });
}
