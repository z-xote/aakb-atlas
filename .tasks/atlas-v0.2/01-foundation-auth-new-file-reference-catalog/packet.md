# Task Packet: Atlas v0.2 milestone 1 — foundation

- **ID:** atlas-v0.2-01-foundation-auth-new-file-reference-catalog
- **Created:** 2026-07-15
- **Compiled by:** Codex
- **Repo:** `C:\Users\Varshil\Desktop\Windows\Projects\aakb-atlas`  **Branch:** `codex/aakb-atlas-v0.2`
- **Original intention (verbatim):** “Implement the reference catalog alongside the authentication changes and the new file. If we can do all of that and I can test it and everything looks clean on the final app, then we can go ahead and add the new site images tab as well as the side details tab.”

## Instructions to the executor

You are executing this task packet. It is self-contained — you need no other
context. Proceed in this order:

1. Verify every item in **Start State**. If any check fails, stop immediately,
   change nothing, and write a report with status BLOCKED explaining which
   check failed and what you observed.
2. Do the work. **End State** criteria are binding. **Suggested Approach** is
   advisory — you may deviate, but log every deviation in the report.
3. Respect **Non-Goals** absolutely, even where the adjacent work seems
   obviously beneficial. Note tempting improvements in the report instead.
4. Run every command in **Verification** and record actual output.
5. Write `report.md` in this packet's folder using the Report Requirements
   section below. Do this even on failure — especially on failure.

## Objective

Deliver the first independently testable Atlas v0.2 checkpoint: real approved-device authentication, the four-step new-file wizard, and the real company Reference Catalog with authenticated CLI management and Bunny-backed reference images, while leaving the existing production navigation shell visually and structurally unchanged.

## Context

Read `.tasks/atlas-v0.2/FINAL-SPEC.md` completely before implementation. Sections 1–6, 8–10, 12–13, and Milestone 1 of section 15 are binding for this packet.

The production navigation already exists in `src/features/files/components/file-ui.tsx` as `AtlasTopbar` and `FileBottomNav`. The mockup's `MockTopbar` and `MockBottomNav` deliberately mirror those production components. Do not replace or restyle the production top bar. Extend the shared bottom-navigation pattern for wizard Back/Next/Create actions.

Relevant mockup screens are:

- `src/app/mockup/screens/enrollment.tsx`
- `src/app/mockup/screens/waiting-approval.tsx`
- `src/app/mockup/screens/pin-unlock.tsx`
- `src/app/mockup/screens/pin-forgotten.tsx`
- `src/app/mockup/screens/files-list.tsx`
- `src/app/mockup/screens/new-file.tsx`
- `src/app/mockup/screens/reference-catalog.tsx`

Current backend gaps:

- `src/services/auth/` is shared-password auth and must be replaced in the production path.
- `src/db/schema.ts` has no device, enrollment, challenge, session, reference-category, or reference-image records.
- `src/services/bunny/client.ts` constructs paths but does not upload/retrieve bytes.
- No Atlas CLI currently calls an authenticated local HTTP API.

The Reference Catalog web UI is browse/search/filter only. The CLI may create categories and upload reference images. Reference bytes are canonical in Bunny and Bunny credentials remain server-only.

Human involvement is intentional. Near completion, present the exact required local environment keys without asking the user to paste secrets into chat. The user configures Bunny/auth/CLI values locally, then tests the real UI and CLI. Do not begin Milestone 2.

## Start State (verify first)

- [ ] `git branch --show-current` prints `codex/aakb-atlas-v0.2`.
- [ ] `.tasks/atlas-v0.2/FINAL-SPEC.md` contains `### Milestone 1 — foundation, authentication, new file, and Reference Catalog`.
- [ ] `src/features/files/components/file-ui.tsx` exports `AtlasTopbar` and `FileBottomNav`.
- [ ] All seven relevant mockup screen files listed in Context exist.
- [ ] `git status --short` is reviewed and every pre-existing user/mockup change is preserved; a dirty mockup worktree is expected.
- [ ] Read the applicable `AGENTS.md` and relevant Next.js 16.2.9 guides under `node_modules/next/dist/docs/` before changing routes, cookies, request APIs, or server actions.
- [ ] `bun run lint` passes.
- [ ] `bun run build` passes.

## End State — Acceptance Criteria (binding)

1. The production `AtlasTopbar` DOM hierarchy, styling hooks, breadcrumb behavior, and visible actions are unchanged except for new page-specific breadcrumb text.
2. Shared schema/API primitives exist for structured JSON success/errors, validation, authenticated device sessions, and CLI-admin authorization; the CLI never opens the `sql.js` file.
3. A new device generates/stores its private key locally, creates an enrollment, proves key possession, displays a short code/fingerprint, and can be approved by `atlas devices approve <code>`.
4. An approved device can set a four-digit PIN, unlock with fresh key proof plus server-verified PIN, receive remaining-attempt/rate-limit feedback, lock after 15 minutes of inactivity, reset its PIN through the CLI flow, and be revoked.
5. The old shared-password login is not reachable in the production authentication path after device auth is configured.
6. `/files/new` implements the four-step Basics/Scope/Pipeline/Contact wizard and persists every existing file, contact, and note field.
7. The wizard uses the shared production top bar and bottom-action pattern and supports both **Create only, without a photo** and **Create & take first photo**. Because capture is Milestone 2, the second action may land on an explicit “capture arrives in Milestone 2” handoff state rather than a fake camera.
8. The production Reference Catalog uses persisted categories/reference records, supports browse/search/category filters, and has no UI upload/category-management controls.
9. `atlas references categories create` and `atlas references upload` call authenticated Atlas HTTP endpoints, upload real bytes through Atlas to Bunny, and make the new reference visible in the web catalog.
10. Device and reference CLI commands provide stable compact output and `--json`; secrets and diagnostics never pollute stdout.
11. Production files do not import `src/app/mockup/mock-data.ts` or use seeded mock references/devices.
12. Automated tests cover enrollment proof/expiry, challenge one-time use, PIN hashing/rate limiting, reset/revoke session invalidation, wizard validation/persistence, CLI auth, and reference upload metadata.
13. A human has completed the gate below and explicitly approved Milestone 1. Until then the report status is PARTIAL, not ACHIEVED.

## Non-Goals

- Site Images, capture/review, file image metadata, or the new File Details/Images tab behavior; those are Milestone 2.
- Atlas Image source selection, direction entries, OpenAI transcription/generation, history, or lineage; those are Milestone 3.
- Any redesign or replacement of the production top navigation.
- Phone/portrait parity.
- Web UI for reference upload, category creation, or device approval.
- Multi-company tenancy, named staff accounts, WebAuthn, recovery codes, or full PGPAuth extraction.
- Direct browser-to-Bunny upload, direct CLI database access, or asset/reference deletion.

## Constraints

- Preserve all pre-existing worktree changes; do not reset, revert, or overwrite user-authored mockup work.
- Follow the repo's current Next.js documentation before writing framework code.
- Keep private keys on-device and keep Bunny keys, auth secrets, and CLI-admin tokens server-only.
- Use Node `scrypt` with per-device salt for PINs and constant-time comparison where applicable.
- Prefer the official `openpgp` package and Web Crypto/IndexedDB for the device key slice.
- Browser uploads go to Atlas, then Atlas uploads to Bunny.
- Do not implement ahead into Milestones 2 or 3, even if supporting types make it tempting.
- Do not commit, push, or open a PR without separate user approval.

## Suggested Approach (advisory)

1. Read the current Next.js guides and map the existing production nav/auth/file paths.
2. Add focused schema tables, validation, API errors, sessions, and CLI-admin token middleware needed only for this milestone.
3. Implement/test device enrollment, proof, approval CLI, PIN, session, reset, and revoke before changing the UI.
4. Convert the four auth mockups to production screens while reusing `AtlasTopbar` where appropriate.
5. Convert the new-file wizard without changing its underlying existing file contract.
6. Implement Bunny reference upload/retrieval, reference API, CLI commands, then the browse-only catalog.
7. Run automated verification, then start the app and present the human gate checklist. Stop after the user's result.

## Verification

- `git diff --check` -> exits 0.
- `bun run lint` -> exits 0.
- `bun run build` -> exits 0.
- Run the implementation's test command -> exits 0 with the criterion 12 cases.
- `rg -n "mock-data|mockDevice|mockReferences" src --glob '!src/app/mockup/**'` -> no production mock-data imports/usages.
- Inspect the CLI package for `sql.js`, database-file opens, or direct SQLite writes -> no matches.
- Compare before/after `AtlasTopbar` source and a desktop screenshot -> no unapproved structural/visual navigation change.
- Exercise: unknown device -> approve CLI -> set PIN -> unlock -> wrong PIN/rate limit -> inactivity lock -> reset PIN -> unlock -> revoke.
- Exercise: create a full file through the wizard using each completion action and verify persisted data.
- With user-provided local Bunny configuration, upload one real reference through the CLI and verify it appears and loads in the catalog.

### Human gate — stop here

Present the user with a concise checklist and wait for their results:

1. Production top navigation still looks and behaves the same.
2. Device approval, PIN unlock, inactivity lock, and PIN reset feel correct.
3. The full four-step file wizard and both final actions behave correctly.
4. A real CLI-uploaded Bunny reference appears in Reference Catalog with its label/category/tags.
5. Desktop and iPad-landscape catalog/wizard layouts look clean.

After explicit approval, the orchestrator—not this executor—may create `.tasks/atlas-v0.2/01-foundation-auth-new-file-reference-catalog/approval.md` containing `APPROVED` so Milestone 2 can start.

## Report Requirements

Write `report.md` next to this file, following the report template structure:
status (ACHIEVED / PARTIAL / BLOCKED), per-criterion verdict table with
evidence, files changed, deviations from suggested approach, blockers,
follow-up observations.
