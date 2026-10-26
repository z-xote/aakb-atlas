import type { AtlasSession } from "@/services/auth/access";

// Stored in reference_images.created_by. The dev login bypass reports "dev@local".
export function sessionActor(session: AtlasSession) {
  return session.email;
}
