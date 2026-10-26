export type AtlasSession = { userId: string; email: string };

export type AccessResult =
  | { status: "signed_out" }
  | { status: "not_authorised"; email: string | null }
  | { status: "allowed"; session: AtlasSession };

// The fields Atlas reads from a Clerk User.
export type ClerkUserLike = {
  id: string;
  primaryEmailAddress: {
    emailAddress: string;
    verification: { status: string } | null;
  } | null;
};

export function parseAllowedEmails(raw: string) {
  return new Set(
    raw
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

// Only a verified primary email on the allowlist gets in.
export function resolveAccess(user: ClerkUserLike | null, allowedEmails: string): AccessResult {
  if (!user) return { status: "signed_out" };
  const primary = user.primaryEmailAddress;
  const email = primary?.emailAddress.toLowerCase() ?? null;
  const verified = primary?.verification?.status === "verified";
  if (!email || !verified || !parseAllowedEmails(allowedEmails).has(email)) {
    return { status: "not_authorised", email };
  }
  return { status: "allowed", session: { userId: user.id, email } };
}
