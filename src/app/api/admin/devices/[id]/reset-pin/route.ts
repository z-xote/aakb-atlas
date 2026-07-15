import { apiSuccess, withApiErrors } from "@/services/api/response";
import { requireCliAdmin } from "@/services/auth/admin";
import { resetDevicePin } from "@/services/auth/device";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return withApiErrors(async () => {
    requireCliAdmin(request);
    const { id } = await context.params;
    return apiSuccess(await resetDevicePin(id));
  });
}
