# Milestone 1 report

## Status

ACHIEVED

Implementation, real Bunny storage verification, and the explicit human gate are complete.

## Acceptance criteria

| # | Verdict | Evidence |
|---|---|---|
| 1 | PASS | Production pages continue to use `AtlasTopbar`; no new navigation hierarchy was introduced. |
| 2 | PASS | Structured API responses, device sessions, CLI bearer authorization, and HTTP-only CLI access are implemented. |
| 3 | PASS | Live enrollment created a browser key, proved possession, displayed a code/fingerprint, and was approved through the CLI. |
| 4 | PASS | Live PIN setup/unlock/reset was exercised; automated tests cover remaining attempts, rate limiting, inactivity, reset, and revoke. |
| 5 | PASS | The production shared-password login path was removed. |
| 6 | PASS | The four-step wizard persists Basics, Scope, Pipeline, Contact, notes, and prior file fields. |
| 7 | PASS | Both completion actions work; capture uses the explicit Milestone 2 handoff state. |
| 8 | PASS | The persisted Reference Catalog supports browse, search, and category filtering without web management controls. |
| 9 | PASS | CLI uploaded `Atlas Bunny reference` through Atlas into `test atlas aakb-atlas/references/...`; the resulting Bunny CDN URL returned 200 with the exact 25,931 bytes. |
| 10 | PASS | Device/reference CLI commands expose compact and JSON output while diagnostics remain on stderr. |
| 11 | PASS | Production mock-data scan returned no imports/usages. |
| 12 | PASS | `bun test`: 9 tests passed, 26 assertions, 0 failures. |
| 13 | PASS | The user confirmed auth entry, Reference Catalog, and New File wizard behavior and explicitly directed Atlas to begin Milestone 2 after the real Bunny gate. |

## Verification

- `git diff --check`: passed.
- `bun run lint`: passed.
- `bun test`: 9 passed, 26 assertions.
- Live browser: device approval, PIN setup, wrong-PIN feedback, unlock, reset, both wizard actions, catalog browse/search, theme persistence, and iPad-landscape overflow checks passed.
- Production build passed before the final login-frame correction; the corrected frame compiled in the running Next.js app with no browser console errors. A final clean production build remains to be rerun after the active dev server is stopped.
- Real Bunny upload: passed against the reused local Animo Engine configuration under the isolated `test atlas aakb-atlas` prefix; fresh CDN retrieval returned 200.

## Files changed

Changes are confined to the Milestone 1 schema, API/auth, CLI, new-file wizard, Reference Catalog, shared Atlas UI integration, tests, configuration, and this report. Pre-existing mockup work remains preserved.

## Deviations

- Used `ATLAS_STORAGE_DRIVER=local` for automated/live catalog QA because real Bunny credentials were not configured in the process.
- Added a cross-worker persisted-database refresh after live CLI/server QA exposed stale `sql.js` snapshots between Next.js workers.
- Replaced the initial plain PIN fields with the already-approved mockup keypad/dot frames after human visual feedback.
- Replaced the generic production wizard presentation with the binding `new-file` mockup frame after human visual feedback; the existing server action and persistence contract were left unchanged.

## Blockers

None.

## Follow-up observations

- “Company library” was removed from the user-visible production and mockup Reference Catalog UI.
- Site Images, image metadata, and Details/Images navigation remain reserved for Milestone 2.
