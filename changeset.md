[FIX]: Stop Generate and Retry hanging on a spinner that never ends

# v0.9.0 | Focus: Atlas image workspace

-------------------------------- ✦ DETAILS ✦ --------------------------------

## TASKS
-----------------------------------------------------------------------------
1. Add createClientRequestId(), which falls back to getRandomValues()
   when crypto.randomUUID is missing.

2. Wrap generate() in the workspace in try/catch and read the response
   with readGenerationResponse(), which returns null for non-JSON pages.

3. Show the server's error, a timeout note for 502, 504 and 524, or the
   HTTP status, and clear the progress screen on every failure.

4. Give the Retry button a busy state and show failures in a toast.

5. Add tests for the request id fallback and the failure messages.



## DESCRIPTION
-----------------------------------------------------------------------------
After pressing Generate, the progress screen stayed up for good and no
image arrived. Nothing showed in history.

On the plain-http address, crypto.randomUUID() does not exist, so
generate() threw before it sent the request. It had no error handling, so
the progress screen never cleared. Retry had the same call.

The id now comes from getRandomValues(), which works on any page. Any
failure now clears the screen and says what went wrong. A proxy timeout
returns an HTML page instead of JSON. That case now says the image may
still finish, because the server keeps generating after the proxy gives
up.

This does not move generation out of the request. A high-quality run can
still pass Cloudflare's 100-second limit. That needs background
generation and is left for its own change.



## TECHNICAL NOTES
-----------------------------------------------------------------------------
- New: src/features/atlas-image/client-request.ts and
  tests/atlas-image-client-request.test.ts.

- Changed: workspace.tsx generate() and RetryGenerationButton in
  generation-actions.tsx.

- Production evidence, 26 October 2026: nginx logged the session and
  direction POSTs but no POST to /atlas-image/generations. The database
  has no generation row from that day.

- Server change outside git: nginx now redirects visitors on http to
  https and forwards X-Forwarded-Proto https. proxy_read_timeout and
  proxy_send_timeout are 180s.

- bun test: 61 pass, 2 fail. The same 2 tests fail on master (CLI
  bearer auth, Bunny upload). typecheck: only the existing bun:test
  type errors, which master has too.

- Not checked in a browser. UNVERIFIED.


-----------------------------------------------------------------------------

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
