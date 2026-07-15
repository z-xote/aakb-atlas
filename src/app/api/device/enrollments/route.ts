import { apiSuccess, parseJson, withApiErrors } from "@/services/api/response";
import { assertRateLimit, requestIdentity } from "@/services/api/rate-limit";
import { createEnrollment } from "@/services/auth/device";
import { enrollmentSchema } from "@/services/auth/schemas";

export async function POST(request: Request) {
  return withApiErrors(async () => {
    assertRateLimit(`enroll:${requestIdentity(request)}`, { limit: 8, windowMs: 10 * 60_000 });
    const input = await parseJson(request, enrollmentSchema);
    const origin = new URL(request.url).origin;
    return apiSuccess(await createEnrollment({ ...input, origin }), { status: 201 });
  });
}
