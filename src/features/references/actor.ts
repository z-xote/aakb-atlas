import type { getAuthenticatedSession } from "@/services/auth/session";

type AtlasSession = NonNullable<Awaited<ReturnType<typeof getAuthenticatedSession>>>;

// Stored in reference_images.created_by. The dev login bypass reports device "dev-local".
export function sessionActor(session: AtlasSession) {
  return `device:${session.device.id}`;
}
