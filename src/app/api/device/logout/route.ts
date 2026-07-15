import { apiSuccess, withApiErrors } from "@/services/api/response";
import { clearAuthSession } from "@/services/auth/session";

export async function POST() {
  return withApiErrors(async () => {
    await clearAuthSession();
    return apiSuccess({ loggedOut: true });
  });
}
