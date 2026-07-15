import { ApiError, apiSuccess, withApiErrors } from "@/services/api/response";
import { listReferenceCatalog } from "@/features/references/data";
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
