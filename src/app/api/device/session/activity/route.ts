import { ApiError, apiSuccess, withApiErrors } from "@/services/api/response";
import { touchCurrentSession } from "@/services/auth/session";

export async function POST() {
  return withApiErrors(async () => {
    const session = await touchCurrentSession();
    if (!session) throw new ApiError(401, "session_expired", "The device session is locked.");
    return apiSuccess({ active: true });
  });
}
