[FEATURE]: Skip device login when Atlas runs under next dev
# v0.3.0 | Focus: Device login

-------------------------------- ✦ DETAILS ✦ --------------------------------

## TASKS
-----------------------------------------------------------------------------
1. Treat every request as signed in when NODE_ENV is development.

2. Keep the activity ping answering 200 in development, so the client
   does not bounce to /login.



## DESCRIPTION
-----------------------------------------------------------------------------
Every new worktree has its own database, so viewing a branch locally
meant enrolling a device, approving it with the CLI and setting a PIN.
Under next dev, Atlas now lets every request through. A real device
session still wins when one exists. Production builds run with NODE_ENV
production and keep the full device login.




## TECHNICAL NOTES
-----------------------------------------------------------------------------
- src/services/auth/session.ts: getAuthenticatedSession() and
  touchCurrentSession() fall back to DEV_SESSION in development.

- No caller reads fields off the session, only its truthiness, so the
  { dev: true } stub needs no other change.

- /login redirects to /files in development, since isAuthenticated()
  is always true there.

- Checked at localhost:3210/references on 26 October: the catalog
  loads with no device enrolled.

- eslint passes on session.ts. tsc shows only the 4 existing bun:test
  type errors in tests/.


-----------------------------------------------------------------------------
