import { apiSuccess, parseJson, withApiErrors } from "@/services/api/response";
import { assertRateLimit, requestIdentity } from "@/services/api/rate-limit";
import { setDevicePin } from "@/services/auth/device";
import { setPinSchema } from "@/services/auth/schemas";
import { setDeviceSessionCookie } from "@/services/auth/session";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return withApiErrors(async () => {
    assertRateLimit(`pin-set:${requestIdentity(request)}`, { limit: 12, windowMs: 10 * 60_000 });
    const input = await parseJson(request, setPinSchema);
    const { id } = await context.params;
    const session = await setDevicePin({ ...input, enrollmentId: id });
    await setDeviceSessionCookie(session.token);
    return apiSuccess({ deviceId: session.deviceId, unlocked: true });
  });
}
