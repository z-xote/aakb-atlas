import type { getAuthenticatedSession } from "@/services/auth/session";

type AtlasSession = NonNullable<Awaited<ReturnType<typeof getAuthenticatedSession>>>;

// Stored in reference_images.created_by. The `next dev` bypass has no device.
export function sessionActor(session: AtlasSession) {
  return "device" in session ? `device:${session.device.id}` : "dev";
}
