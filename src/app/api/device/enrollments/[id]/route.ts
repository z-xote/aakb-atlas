import { apiSuccess, withApiErrors } from "@/services/api/response";
import { getEnrollmentStatus } from "@/services/auth/device";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return withApiErrors(async () => {
    const { id } = await context.params;
    return apiSuccess(await getEnrollmentStatus(id));
  });
}
