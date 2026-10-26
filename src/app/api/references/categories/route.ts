import { ApiError, apiSuccess, withApiErrors } from "@/services/api/response";
import { listReferenceCatalog } from "@/features/references/data";
import { getAuthenticatedSession } from "@/services/auth/session";

export async function GET() {
  return withApiErrors(async () => {
    if (!(await getAuthenticatedSession())) throw new ApiError(401, "unauthorized", "Unlock Atlas to browse references.");
    return apiSuccess((await listReferenceCatalog()).categories);
  });
}

