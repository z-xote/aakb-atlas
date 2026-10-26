import { afterEach, describe, expect, mock, test } from "bun:test";

import { resolveAccess, type ClerkUserLike } from "@/services/auth/access";

let signedInUser: ClerkUserLike | null = null;

mock.module("@clerk/nextjs/server", () => ({
  currentUser: async () => signedInUser,
}));

const { env } = await import("@/services/env");
const { DEV_SESSION } = await import("@/services/auth/dev-bypass");
const session = await import("@/services/auth/session");
const referencesRoute = await import("@/app/api/references/route");

const ALLOWED = "Megan@Example.com, wayne@example.com";

function user(email: string, status = "verified"): ClerkUserLike {
  return { id: `user_${email}`, primaryEmailAddress: { emailAddress: email, verification: { status } } };
}

async function redirectTarget(run: () => Promise<unknown>) {
  try {
    await run();
  } catch (error) {
    return String((error as { digest?: string }).digest ?? "");
  }
  return "";
}

afterEach(() => {
  signedInUser = null;
  env.ATLAS_DEV_AUTH_BYPASS = false;
});

describe("Clerk email allowlist", () => {
  test("lets a verified allowlisted email in, ignoring case and spaces", () => {
    expect(resolveAccess(user("megan@example.com"), ALLOWED)).toEqual({
      status: "allowed",
      session: { userId: "user_megan@example.com", email: "megan@example.com" },
    });
    expect(resolveAccess(user("WAYNE@example.com"), ALLOWED).status).toBe("allowed");
  });

  test("rejects an email that is not on the list", () => {
    expect(resolveAccess(user("someone@gmail.com"), ALLOWED)).toEqual({
      status: "not_authorised",
      email: "someone@gmail.com",
    });
  });

  test("rejects an allowlisted email that is not verified", () => {
    expect(resolveAccess(user("megan@example.com", "unverified"), ALLOWED).status).toBe("not_authorised");
  });

  test("rejects everyone when the allowlist is empty", () => {
    expect(resolveAccess(user("megan@example.com"), "").status).toBe("not_authorised");
  });

  test("reports a missing user as signed out", () => {
    expect(resolveAccess(null, ALLOWED)).toEqual({ status: "signed_out" });
  });
});

describe("Auth guards on Clerk", () => {
  test("a signed-out API request gets 401", async () => {
    env.ATLAS_ALLOWED_EMAILS = ALLOWED;
    const response = await referencesRoute.GET(new Request("http://localhost/api/references"));
    expect(response.status).toBe(401);
  });

  test("a signed-in account off the allowlist gets 403 from the API", async () => {
    env.ATLAS_ALLOWED_EMAILS = ALLOWED;
    signedInUser = user("someone@gmail.com");
    const response = await referencesRoute.GET(new Request("http://localhost/api/references"));
    expect(response.status).toBe(403);
  });

  test("an allowlisted account gets a session", async () => {
    env.ATLAS_ALLOWED_EMAILS = ALLOWED;
    signedInUser = user("megan@example.com");
    expect(await session.getAuthenticatedSession()).toEqual({
      userId: "user_megan@example.com",
      email: "megan@example.com",
    });
    expect(await session.requireAuth()).toMatchObject({ email: "megan@example.com" });
  });

  test("pages send signed-out visitors to sign-in and outsiders to not-authorised", async () => {
    env.ATLAS_ALLOWED_EMAILS = ALLOWED;
    expect(await redirectTarget(session.requireAuth)).toContain("/sign-in");
    signedInUser = user("someone@gmail.com");
    expect(await redirectTarget(session.requireAuth)).toContain("/not-authorised");
  });

  test("the dev bypass needs no Clerk user", async () => {
    env.ATLAS_DEV_AUTH_BYPASS = true;
    expect(await session.getAuthenticatedSession()).toEqual(DEV_SESSION);
    expect(await session.requireAuth()).toEqual(DEV_SESSION);
  });
});
