import { apiSuccess, parseJson, withApiErrors } from "@/services/api/response";
import { assertRateLimit, requestIdentity } from "@/services/api/rate-limit";
import { issueChallenge } from "@/services/auth/device";
import { challengeSchema } from "@/services/auth/schemas";

export async function POST(request: Request) {
  return withApiErrors(async () => {
    assertRateLimit(`challenge:${requestIdentity(request)}`, { limit: 30, windowMs: 10 * 60_000 });
    const input = await parseJson(request, challengeSchema);
    return apiSuccess(await issueChallenge({ ...input, origin: new URL(request.url).origin }));
  });
}
