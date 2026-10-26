[FEATURE]: Sign in to Atlas with Google through Clerk, allowlisted emails only
# v0.8.0 | Focus: Sign-in

-------------------------------- ✦ DETAILS ✦ --------------------------------

## TASKS
-----------------------------------------------------------------------------
1. Rebuild requireAuth() and getAuthenticatedSession() on Clerk
   currentUser() and keep their call sites unchanged.

2. Allow only a verified primary email listed in ATLAS_ALLOWED_EMAILS.

3. Send signed-out pages to /sign-in and outside accounts to
   /not-authorised. API routes answer 401 signed out and 403 outside.

4. Add src/proxy.ts with clerkMiddleware(), ClerkProvider in the root
   layout, a Clerk sign-in page and a Clerk sign-out button.

5. Skip Clerk entirely when ATLAS_DEV_AUTH_BYPASS is active.

6. Delete the device enrollment, PIN, session cookie and activity code,
   the /api/device routes, the admin device routes and atlas devices.

7. Drop the device_enrollments, devices, auth_challenges and
   device_sessions tables on database start.

8. Allow the Clerk Development hosts in the CSP.

9. Rewrite FINAL-SPEC.md section 5.1 for Clerk sign-in.

10. Add tests for the allowlist, the 401 and 403 answers, the page
    redirects and the dev bypass.



## DESCRIPTION
-----------------------------------------------------------------------------
Atlas used OpenPGP device enrollment, a CLI approval, a PIN and its own
session cookie. Megan and Wayne need a normal sign-in instead.

Atlas now signs people in with Google through the existing Clerk
Development instance of the AAKB Atlas application. Clerk proves who the
person is. Atlas then lets in only a verified primary email on the
ATLAS_ALLOWED_EMAILS list. Any other Google account sees a "Not
authorised" page with a sign-out button, and the API refuses it.

The old login is gone, not hidden. Its routes return 404, nothing reads
the atlas_device_session cookie, and its tables are dropped. Old device
sessions therefore stop working at the first request after deploy.

The two guard functions keep their names and return a session or null,
so the page and API call sites, about 40, did not change. The CLI keeps its
ATLAS_CLI_ADMIN_TOKEN bearer token.




## TECHNICAL NOTES
-----------------------------------------------------------------------------
- src/services/auth/access.ts holds resolveAccess() and
  parseAllowedEmails(). They are pure functions, so tests need no Clerk.

- src/services/auth/session.ts: getAccess() returns signed_out,
  not_authorised or allowed. getAuthenticatedSession() throws
  ApiError(403) for not_authorised. Every caller is inside
  withApiErrors(), so the throw becomes a 403 response.

- The session shape is now { userId, email }. DEV_SESSION is
  { userId: "dev-local", email: "dev@local" }.

- Next 16 renames middleware to proxy, per
  node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md.
  The proxy only attaches Clerk state. The guards decide access.

- Under the dev bypass the proxy skips clerkMiddleware() and the layout
  skips ClerkProvider, so local runs need no Clerk keys. The
  ClerkEnabled context hides the sign-out button in that mode, because
  file-ui.tsx also loads in client components and cannot read env.

- Migration: the repo has no drizzle-kit migration history. Its schema
  lives in ensureDatabase() in src/db/client.ts, so the DROP TABLE IF
  EXISTS statements live there too. The four tables are dropped, not
  frozen.

- next.config.ts: CSP adds https://*.clerk.accounts.dev,
  challenges.cloudflare.com, *.protect.clerk.com and clerk-telemetry.
  /login redirects to /sign-in.

- env: ATLAS_SESSION_COOKIE is removed and ATLAS_ALLOWED_EMAILS is
  added. .env.example lists NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  CLERK_SECRET_KEY, NEXT_PUBLIC_CLERK_SIGN_IN_URL and
  ATLAS_ALLOWED_EMAILS.

- Dependencies: add @clerk/nextjs 7.9.20, remove openpgp.

- Gate after merging master at 72678e3: bun test 33 pass, 2 fail. Both
  failures are the known Milestone 1 tests on master. typecheck shows
  only "Cannot find module bun:test", 7 times, one per test file. lint is
  clean.

- UNVERIFIED: Google sign-in end to end, locally and on
  atlas.allaboutkitchens.nz. .env has no Clerk keys yet and the
  allowlist emails are not set. bun run build was not run.

- INFERRED: the Development Frontend API host matches
  *.clerk.accounts.dev.


-----------------------------------------------------------------------------
