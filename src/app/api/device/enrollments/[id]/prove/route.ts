import { apiSuccess, parseJson, withApiErrors } from "@/services/api/response";
import { assertRateLimit, requestIdentity } from "@/services/api/rate-limit";
import { proveEnrollment } from "@/services/auth/device";
import { enrollmentProofSchema } from "@/services/auth/schemas";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return withApiErrors(async () => {
    assertRateLimit(`prove:${requestIdentity(request)}`, { limit: 12, windowMs: 10 * 60_000 });
    const { id } = await context.params;
    const input = await parseJson(request, enrollmentProofSchema);
    return apiSuccess(await proveEnrollment(id, input.signature));
  });
}
