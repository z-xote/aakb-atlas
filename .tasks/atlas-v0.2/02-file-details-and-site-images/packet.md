# Task Packet: Atlas v0.2 milestone 2 — Site Images

- **ID:** atlas-v0.2-02-file-details-and-site-images
- **Created:** 2026-07-15
- **Compiled by:** Codex
- **Repo:** `C:\Users\Varshil\Desktop\Windows\Projects\aakb-atlas`  **Branch:** `codex/aakb-atlas-v0.2`
- **Original intention (verbatim):** “If we can do all of that and I can test it and everything looks clean on the final app, then we can go ahead and add the new site images tab as well as the side details tab.”

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

Deliver the second independently testable Atlas v0.2 checkpoint: the production File Details and Site Images sibling views, real iPad capture/upload through Atlas to Bunny, searchable/filterable file image records, and editable image metadata, while preserving the existing top navigation and established file/pipeline bottom-navigation model.

## Context

Read `.tasks/atlas-v0.2/FINAL-SPEC.md` completely before implementation. Sections 3–10, 13–14, and Milestone 2 of section 15 are binding for this packet.

Milestone 1 must already provide device auth, real files/new-file wizard, Reference Catalog, Bunny server integration, HTTP/CLI foundations, and explicit user approval. Reuse those foundations; do not replace them.

Relevant production and mockup files include:

- `src/app/files/[id]/page.tsx`
- `src/features/files/components/file-ui.tsx`
- `src/features/files/components/file-images-panel.tsx`
- `src/app/mockup/screens/file-details.tsx`
- `src/app/mockup/screens/photo-capture.tsx`
- `src/app/mockup/screens/image-metadata.tsx`
- `src/app/mockup/mock-ui.tsx` for visual reference only

The production `AtlasTopbar` is immutable navigation chrome. The File Details/Images relationship belongs in the production bottom navigation. The mockup describes a half-and-half file nav where the left side switches Details/Images as appropriate and the right side opens Pipelines. Reuse/extend `FileBottomNav`; do not introduce a second top-level navigation system.

Image bytes are canonical in Bunny. Browser camera/file-picker bytes go to Atlas first. Metadata includes optional label, room/custom room, tags, and nullable `cameraPositionClock` in `12|2|3|4|6|8|9|10`. The field is camera location relative to the door, not lens heading. Generated images are not implemented in this milestone, but the asset schema must remain extensible for them.

Human involvement is intentional. The user will test real capture and upload on an iPad in landscape with their Bunny configuration. Do not begin Milestone 3.

## Start State (verify first)

- [ ] `git branch --show-current` prints `codex/aakb-atlas-v0.2`.
- [ ] `.tasks/atlas-v0.2/01-foundation-auth-new-file-reference-catalog/report.md` exists and reports `Status: ACHIEVED`.
- [ ] `.tasks/atlas-v0.2/01-foundation-auth-new-file-reference-catalog/approval.md` exists and contains `APPROVED`.
- [ ] `.tasks/atlas-v0.2/FINAL-SPEC.md` contains `### Milestone 2 — File Details and Site Images`.
- [ ] Production device auth, file creation, and Bunny reference retrieval still pass their Milestone 1 verification.
- [ ] Read applicable `AGENTS.md` and relevant Next.js 16.2.9 guides before changing routes, server actions, request bodies, or caching.
- [ ] `bun run lint` passes.
- [ ] `bun run build` passes.

## End State — Acceptance Criteria (binding)

1. The existing production `AtlasTopbar` remains structurally and visually unchanged except for page-specific breadcrumb text.
2. File Details and Images are real sibling views reached through the shared production bottom-navigation model; Pipelines remains available in its established bottom-nav position.
3. The Details view preserves the current file, contact, project, and note information/actions; no existing file field is lost.
4. The Images view lists persisted assets for the current file and supports capture, upload, label/tag search, site/generated kind filters, room filters, and **No room**.
5. iPad landscape can open the camera or file picker, capture/select one image, review it, retake/cancel, optionally set camera position/room/label, and save it.
6. Upload bytes travel browser -> Atlas -> Bunny. Bunny credentials never enter browser code, and the asset reports `pending`, `ready`, or `failed` truthfully.
7. A Bunny/storage failure leaves a retryable asset/upload state and never presents the asset as fully stored.
8. The metadata screen edits label, room/custom room, ordered tags, and nullable camera position and displays origin, capture time, Bunny key, and CDN URL as read-only facts.
9. Only `12|2|3|4|6|8|9|10|null` is accepted for `cameraPositionClock`; `6` is stored as opposite the door/back wall.
10. The new-file wizard's **Create & take first photo** action now opens the real capture flow for the newly persisted file.
11. An image card can launch the future Atlas Image entry point without implementing generation; an explicit “Atlas Image arrives in Milestone 3” handoff is acceptable.
12. Production screens use persisted data and do not import mock assets.
13. Automated tests cover upload validation, Bunny success/failure transitions, cross-file authorization, metadata validation/round-trip, and wizard-to-capture routing.
14. A human has completed the gate below and explicitly approved Milestone 2. Until then the report status is PARTIAL, not ACHIEVED.

## Non-Goals

- Reference Catalog redesign or changes to approved Milestone 1 auth/new-file behavior.
- OpenAI, Atlas Image generation history, source selection, direction/reference workspace, transcription, results, or lineage.
- Generated-image production behavior beyond schema compatibility and kind filtering.
- Bulk rapid capture or background multi-photo annotation.
- Direct browser-to-Bunny upload.
- Asset deletion/archive, image transformation, or compression pipeline beyond what Bunny/OpenAI integration requires later.
- Top-navigation redesign or phone/portrait parity.

## Constraints

- Preserve the approved Milestone 1 behavior and all user-authored mockup changes.
- Reuse `AtlasTopbar`, `FileBottomNav`, and the shared production bottom-action styling.
- Camera position is optional and describes camera location relative to the 12 o'clock door anchor.
- Validate MIME type, byte size, file ownership, and metadata server-side.
- Do not expose Bunny secrets, local filesystem paths, or raw storage errors to the client.
- Keep the branch buildable and stop before Milestone 3.
- Do not commit, push, or open a PR without separate user approval.

## Suggested Approach (advisory)

1. Extend the asset schema/domain types and add upload/metadata tests first.
2. Finish reusable Bunny asset upload/retrieval with honest persistence transitions.
3. Extend `FileBottomNav` and production File Details routing/state without changing `AtlasTopbar`.
4. Build the Images gallery/search/filter behavior from persisted server data.
5. Implement camera/file-picker and one-photo review for iPad landscape, then metadata editing.
6. Connect the new-file capture action and future Atlas Image handoff.
7. Run automated checks, then present the iPad/Bunny human gate and stop.

## Verification

- `git diff --check` -> exits 0.
- `bun run lint` -> exits 0.
- `bun run build` -> exits 0.
- Run the implementation's test command -> exits 0 with the criterion 13 cases and Milestone 1 regression coverage.
- `rg -n "mockAssets|mock-data" src --glob '!src/app/mockup/**'` -> no production mock imports/usages.
- Inspect the browser bundle/source for Bunny access keys -> no secret value or server env exposure.
- At 1024x768 iPad landscape: create file -> take first photo -> review -> set optional metadata -> save -> find/filter/search -> edit metadata.
- Exercise an upload failure and retry and verify the stored/UI status transition.
- Compare before/after production topbar screenshot/source -> no unapproved change.
- Verify Details/Images/Pipelines bottom navigation with touch and keyboard interaction and no page-level horizontal overflow.

### Human gate — stop here

Present the user with a concise checklist and wait for their results:

1. Top navigation remains unchanged.
2. Details, Images, and Pipelines feel like one consistent bottom-navigation system.
3. iPad-landscape camera/file-picker, review, retake, and save behavior feel correct.
4. Real images appear in Bunny and reload correctly from a fresh browser session.
5. Room, tags, label, and eight-position camera metadata survive edit/reload.
6. Search, kind filters, room filters, and empty states look clean.

After explicit approval, the orchestrator—not this executor—may create `.tasks/atlas-v0.2/02-file-details-and-site-images/approval.md` containing `APPROVED` so Milestone 3 can start.

## Report Requirements

Write `report.md` next to this file, following the report template structure:
status (ACHIEVED / PARTIAL / BLOCKED), per-criterion verdict table with
evidence, files changed, deviations from suggested approach, blockers,
follow-up observations.
