import { apiSuccess, withApiErrors } from "@/services/api/response";
import { requireCliAdmin } from "@/services/auth/admin";
import { approveEnrollment } from "@/services/auth/device";

export async function POST(
  request: Request,
  context: { params: Promise<{ code: string }> }
) {
  return withApiErrors(async () => {
    requireCliAdmin(request);
    const { code } = await context.params;
    return apiSuccess(await approveEnrollment(code));
  });
}
