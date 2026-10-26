[FEATURE]: Skip device login locally only when ATLAS_DEV_AUTH_BYPASS is set
# v0.5.0 | Focus: Device login

-------------------------------- ✦ DETAILS ✦ --------------------------------

## TASKS
-----------------------------------------------------------------------------
1. Add the ATLAS_DEV_AUTH_BYPASS flag to the env schema and its name to
   .env.example. The values 1 and true turn it on.

2. Return a fixed dev@local session from getAuthenticatedSession() and
   requireAuth() when the flag is set and NODE_ENV is not production.

3. Answer the activity ping for the dev session too, so the client does
   not bounce to /login.

4. Log a warning at startup when the flag is set in production, and
   keep device login on.

5. Show a "Dev mode, login skipped" badge in the app shell header while
   the bypass is on.

6. Add unit tests for the flag in development, without the flag, and in
   production.



## DESCRIPTION
-----------------------------------------------------------------------------
Under next dev, Atlas let every request through with no way to turn it
off. Testing the real login locally was not possible, and the screen gave
no sign that login was skipped.

The skip is now opt-in. Set ATLAS_DEV_AUTH_BYPASS=1 to work without a
device and PIN. Without the flag, next dev asks for the device login
again. Production ignores the flag. The bypass lives inside the two guard
functions, so no page or API route changes, and the Clerk work in VAR-27
can keep it. requireCliAdmin() still needs the bearer token.




## TECHNICAL NOTES
-----------------------------------------------------------------------------
- src/services/auth/dev-bypass.ts holds isDevAuthBypassActive() and
  DEV_SESSION. DEV_SESSION has the same shape as a findActiveSession()
  row, with device name dev@local.

- src/services/auth/session.ts checks the bypass first in
  getAuthenticatedSession(), requireAuth() and touchCurrentSession(). The
  bypass skips the cookie and database lookup. The old NODE_ENV
  development fallback is gone.

- src/services/env.ts parses the flag to a boolean and warns once when
  it is set with NODE_ENV production.

- src/components/app-shell.tsx renders the badge. AppShell is a server
  component, so the flag never reaches the client bundle.

- tests/dev-auth-bypass.test.ts covers the three flag cases and the dev
  session shape.

- Gate: bun run lint passes. bun test: 28 pass, 2 fail. bun run
  typecheck: 5 errors, all "Cannot find module bun:test" in tests/. The
  same failures exist on master: 4 type errors, the same 2 tests. Both
  failing milestone1 tests pass when run alone. INFERRED: another test
  file loads src/services/env.ts before milestone1 sets process.env.

- UNVERIFIED: the dev server was not run. The badge and the bypass on
  pages and /api/files/** and /api/references/** routes were not checked
  in a browser.


-----------------------------------------------------------------------------
