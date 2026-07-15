# Task Packet: Atlas v0.2 milestone 3 — Atlas Image

- **ID:** atlas-v0.2-03-atlas-image-pipeline
- **Created:** 2026-07-15
- **Compiled by:** Codex
- **Repo:** `C:\Users\Varshil\Desktop\Windows\Projects\aakb-atlas`  **Branch:** `codex/aakb-atlas-v0.2`
- **Original intention (verbatim):** “I think for the text area, I just want to make it append-only, like you add the text before it gets sent to the generator. I think that makes more sense instead of having a separate LLM respond back with something like \"Got it, I'll keep the windows, etc.\" because that's kind of useless.” / “At the end, once Generate Concept is clicked, it takes all the references plus the user's chat inputs and runs through an image generation model. The image generation model is going to be GPT Image 2, either medium or high.”

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

Deliver the third Atlas v0.2 checkpoint: a production staged Atlas Image pipeline that uses persisted source images, catalog references, and an append-only user direction log to create one GPT Image 2 concept, stores outputs in Bunny with complete history/lineage, and exposes honest generation states without changing the production navigation shell or adding a conversational text assistant.

## Context

Read `.tasks/atlas-v0.2/FINAL-SPEC.md` completely before implementation. Sections 3–14, Milestone 3 of section 15, and release criteria 9–20 are binding for this packet.

Milestones 1 and 2 must already provide approved device auth, real files, Reference Catalog, Bunny integration, File Details/Site Images, image metadata, shared API validation, and explicit user approval. Reuse those foundations.

Relevant mockups are:

- `src/app/mockup/screens/pipelines.tsx`
- `src/app/mockup/screens/source-selection.tsx`
- `src/app/mockup/screens/generation-workspace.tsx`
- `src/app/mockup/screens/phone-workspace.tsx` as graceful fallback only
- `src/app/mockup/screens/generation-result.tsx`
- `src/app/mockup/screens/generation-detail.tsx`

The route is currently a placeholder at `src/app/files/[id]/pipelines/atlas-image/page.tsx`. Production uses the existing `AtlasTopbar` and shared sticky bottom navigation for Back/New Generation, Back/Generate Concept, retry/rephrase, continue/finish, and generation-detail actions.

The left workspace is not a chatbot. It is an ordered, append-only list of user direction entries. The composer draft is editable until the user adds it; after addition, corrections are new entries. There are no assistant roles, acknowledgement messages, text-LLM calls, or intermediate LLM-generated briefs. Voice transcription returns an editable composer draft and does not add or submit it automatically.

When **Generate concept** is clicked, snapshot:

1. the selected structural source image;
2. pinned reference images in selection order;
3. every direction entry in chronological order.

Call the Image API `images.edit` endpoint directly with `model: "gpt-image-2"`. The source is the first image input and references follow. Request one output. `ATLAS_IMAGE_QUALITY` accepts `medium|high`; begin integration with `medium`, persist the chosen quality per run, and perform the human A/B gate before selecting the production default.

Current official references:

- <https://developers.openai.com/api/docs/guides/image-generation#edit-images>
- <https://developers.openai.com/api/docs/guides/image-generation#customize-image-output>
- <https://developers.openai.com/api/docs/guides/speech-to-text>

Human involvement is intentional. The user configures `OPENAI_API_KEY` locally and verifies GPT Image 2 access; secrets are never pasted into chat or committed. Do not commit/push after the gate without separate approval.

## Start State (verify first)

- [ ] `git branch --show-current` prints `codex/aakb-atlas-v0.2`.
- [ ] `.tasks/atlas-v0.2/01-foundation-auth-new-file-reference-catalog/report.md` and `.tasks/atlas-v0.2/02-file-details-and-site-images/report.md` exist and report `Status: ACHIEVED`.
- [ ] `.tasks/atlas-v0.2/01-foundation-auth-new-file-reference-catalog/approval.md` and `.tasks/atlas-v0.2/02-file-details-and-site-images/approval.md` exist and contain `APPROVED`.
- [ ] `.tasks/atlas-v0.2/FINAL-SPEC.md` contains `### Milestone 3 — Atlas Image pipeline` and `model: "gpt-image-2"`.
- [ ] Real file assets and Reference Catalog images load through the server/Bunny foundation.
- [ ] Read applicable `AGENTS.md`, relevant Next.js 16.2.9 guides, and the three current official OpenAI references in Context before implementation.
- [ ] `bun run lint` passes.
- [ ] `bun run build` passes.

## End State — Acceptance Criteria (binding)

1. The production top-navigation structure and visual treatment remain unchanged; all Atlas Image stages use the shared production bottom-action navigation pattern.
2. Pipelines shows persisted Atlas Image history with complete, generating, retryable, blocked, and failed/cancelled outcomes and a New Generation action.
3. Source selection offers Take Photo, Use Library, and Upload, requires exactly one explicit source, and accepts site photos or completed generated outputs.
4. The direction workspace contains only user entries. Adding text appends an immutable ordered entry; no assistant message UI, assistant-role record, acknowledgement API call, or intermediate text-LLM call exists.
5. Voice recording is sent to the server Audio Transcriptions API and returns editable text to the composer; it never auto-adds, auto-submits, or starts generation.
6. Several persisted references may be selected across categories, remain visible in a pinned tray, and retain selection order for the job snapshot.
7. Generate Concept snapshots one source, all ordered references, and all ordered direction entries under a client request ID before starting provider work.
8. The server calls Image API `images.edit` directly with `model: "gpt-image-2"`, source first, references after, one output, and configured `medium|high` quality. No Responses/text-assistant loop is used.
9. Every generation persists source, direction snapshot/compiled prompt, references, provider request ID, model, quality, status, errors, output asset, and timestamps.
10. A successful output uploads to Bunny, appears immediately in File Images/history, and only then marks the generation complete.
11. Provider/network/storage errors are classified into honest retryable, blocked, failed, or cancelled states; retry creates a new auditable attempt and idempotent client retries do not duplicate billed jobs.
12. Continue editing uses the chosen completed output as the next structural source, adds subsequent user entries to the lineage, and preserves all prior generations.
13. Generation detail shows before/after, direction entries/compiled prompt, references, lineage, provider/model/quality metadata, source link, regenerate, and continue-editing actions.
14. Phone/portrait remains a usable sequential fallback, but desktop and iPad landscape are the release-quality workspace targets.
15. Automated tests cover prompt/input ordering, no assistant-message path, transcription draft behavior, generation idempotency, status classification, Bunny completion ordering, and lineage.
16. A human has completed the medium/high and end-to-end gate below and explicitly approved Milestone 3. Until then the report status is PARTIAL, not ACHIEVED.

## Non-Goals

- A text chatbot, assistant acknowledgement messages, prompt summarizer, or separate LLM-generated brief.
- Responses API conversation state or `previous_response_id` dependency.
- More than one generated output by default.
- Automatic source selection, multiple structural-source fusion, or automatic reference selection.
- Mask drawing/inpainting UI.
- Phone/portrait pixel parity.
- Changes to approved auth, Reference Catalog, File Details, Site Images, or navigation behavior outside required integration.
- Generation or asset deletion.
- Commit, push, PR, or deployment without separate user approval.

## Constraints

- Use `gpt-image-2` through the Image API edits endpoint with source input first and reference inputs after it.
- Support only `medium` and `high` for the production quality setting in this release; default to `medium` until the human comparison.
- Keep OpenAI/Bunny secrets server-only and configurable through local environment values.
- The direction log is append-only and user-only; voice is merely another draft source.
- Preserve the existing `AtlasTopbar`, file/pipeline routing, and sticky bottom-navigation visual language.
- Create the generation record/snapshot before the provider call and do not mark complete before Bunny plus database persistence succeed.
- Preserve all user-authored worktree changes and approved milestone behavior.

## Suggested Approach (advisory)

1. Add thread/direction/generation/reference-link schema and invariant tests.
2. Implement generation history/detail APIs, idempotent request creation, and status transitions with a fake provider first.
3. Build source selection and append-only direction/reference workspace using persisted records and shared navigation.
4. Implement bounded server transcription into an editable draft.
5. Implement direct GPT Image 2 `images.edit`, ordered inputs, Bunny output persistence, and error classification.
6. Add result/detail/continue-editing screens and lineage tests.
7. Run the entire pipeline with test doubles, then ask the user to configure the real OpenAI key locally.
8. Run the controlled medium/high comparison and full human checklist. Stop after the result/report.

## Verification

- `git diff --check` -> exits 0.
- `bun run lint` -> exits 0.
- `bun run build` -> exits 0.
- Run the implementation's test command -> exits 0 with criterion 15 coverage and Milestone 1/2 regression coverage.
- `rg -n "assistant|previous_response_id|responses\.create|chat\.completions" src/app/files src/features src/services/openai --glob '!src/app/mockup/**'` -> no Atlas Image assistant/conversation implementation matches; benign unrelated copy/comments must be explained.
- Provider-spy test verifies input image 0 is the source, later images exactly match reference selection order, prompt entries preserve chronological order, output count is one, model is `gpt-image-2`, and quality is configured.
- Failure tests verify duplicate client request IDs do not create duplicate provider jobs and output is not complete before Bunny/database success.
- Desktop and 1024x768 iPad landscape: history -> source -> append directions -> select references -> Generate Concept -> result -> detail -> Continue editing.
- Verify voice transcript remains editable and unsent until the user explicitly adds it.
- Compare before/after `AtlasTopbar` source/screenshot -> no unapproved navigation change.

### Human gate — stop here

Present the user with a concise checklist and wait for their results:

1. Configure `OPENAI_API_KEY` locally and verify GPT Image 2 is available; never request the key in chat.
2. Confirm the workspace feels like a user direction log, not a chatbot, and contains no useless assistant replies.
3. Run one representative renovation job at `medium` and the identical job at `high` using the same source, references, and direction entries.
4. Record output quality, latency, and any obvious geometry drift. Let the user choose the production `ATLAS_IMAGE_QUALITY` default.
5. Confirm the winning result is in Bunny, File Images, history, and generation detail after reload.
6. Continue editing that output and verify lineage and prior history remain intact.
7. Exercise retryable and blocked states and confirm their recovery actions make sense.

Only after explicit approval may the report be marked ACHIEVED. Do not create a commit, push, PR, or deployment unless separately instructed.

## Report Requirements

Write `report.md` next to this file, following the report template structure:
status (ACHIEVED / PARTIAL / BLOCKED), per-criterion verdict table with
evidence, files changed, deviations from suggested approach, blockers,
follow-up observations.
