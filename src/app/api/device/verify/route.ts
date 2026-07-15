import { apiSuccess, parseJson, withApiErrors } from "@/services/api/response";
import { assertRateLimit, requestIdentity } from "@/services/api/rate-limit";
import { verifyDeviceUnlock } from "@/services/auth/device";
import { verifyDeviceSchema } from "@/services/auth/schemas";
import { setDeviceSessionCookie } from "@/services/auth/session";

export async function POST(request: Request) {
  return withApiErrors(async () => {
    assertRateLimit(`verify:${requestIdentity(request)}`, { limit: 40, windowMs: 10 * 60_000 });
    const input = await parseJson(request, verifyDeviceSchema);
    const session = await verifyDeviceUnlock(input);
    await setDeviceSessionCookie(session.token);
    return apiSuccess({ deviceId: session.deviceId, unlocked: true });
  });
}
