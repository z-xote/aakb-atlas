import { apiSuccess, withApiErrors } from "@/services/api/response";
import { listReferenceCatalog } from "@/features/references/data";
import { requireCliAdmin } from "@/services/auth/admin";

export async function GET(request: Request) {
  return withApiErrors(async () => {
    requireCliAdmin(request);
    const url = new URL(request.url);
    const query = (url.searchParams.get("q") ?? "").trim().toLowerCase();
    const category = url.searchParams.get("category");
    const images = (await listReferenceCatalog()).images.filter((image) =>
      (!category || image.categorySlug === category) &&
      (!query || [image.label, image.categoryLabel, ...image.tags].join(" ").toLowerCase().includes(query))
    );
    return apiSuccess(images);
  });
}
