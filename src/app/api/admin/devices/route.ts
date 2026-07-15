import { apiSuccess, withApiErrors } from "@/services/api/response";
import { requireCliAdmin } from "@/services/auth/admin";
import { listDevices } from "@/services/auth/device";

export async function GET(request: Request) {
  return withApiErrors(async () => {
    requireCliAdmin(request);
    return apiSuccess(await listDevices());
  });
}
