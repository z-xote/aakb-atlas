# Task Packet: Redesign frame 13 as a deliberate mobile pipeline

- **ID:** 2026-07-15-redesign-frame-13-mobile-workspace
- **Created:** 2026-07-15
- **Compiled by:** Codex (GPT-5)
- **Repo:** C:\Users\Varshil\Desktop\Windows\Projects\aakb-atlas  **Branch:** v0.2-ui
- **Original intention (verbatim):** "okay, I need you to look at the mockup of the current project in the 13th frame. I am not very convinced that I like the way the mobile is created. If you take a look at how all of the mobile views are created, I don't like the way it's created. If you look at our previous frames or our different mockups, and even the application itself, you'll notice that the application is based off one core fact: a top nav with little information about the project and very little navigation; a bottom nav that has usually two major buttons that are full width, half and half. With this, we are very much not afraid to create a multi-stage pipeline where we can go back and forth to edit different information. I want to represent this in mobile as well, and I am having a hard time expressing what the hell is going wrong. If you take a look at my current agent's work on the 13th frame, the whole mobile is just a mess. I like the way that the desktop, or I guess landscape mobile, is referenced. Even that is pretty ridiculous. It's a little ugly, but not the best description. The chat stage for the mobile vertical is just bad. I guess mobile horizontal is OK, and the same thing with mobile horizontal with the reference stage. This vertical stage is just terrible. What I want you to do is, using the intent compiler skill, compile an execution packet that I can send to one of my UI agents, specifically Opus, to go ahead and work on making the UI better and instilled with the rest of the application, essentially with the core ideas that we have in mind. You are free to go ahead and open this up in a browser, take screenshots, see what you like and what you don't like, as well as read the code. You will be making the entire execution packet yourself, and then I will run this through an Opus agent to see what the output looks like for this 13th frame."

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

Redesign mockup frame 13 (`phone-workspace`) so portrait phone is an intentional, calm, stage-based Atlas Image workflow rather than a landscape composition squeezed into a narrow frame. The finished frame must visibly inherit Atlas's core application grammar: a small top bar with only essential project/stage context, one focused stage at a time, and a persistent bottom bar containing two equal-width major actions that let the user move backward and forward without losing their work. Portrait is the priority; the existing landscape version must remain supported and may be tightened where needed.

## Context

- Frame numbering comes from `src/app/mockup/screens/index.ts`. `phone-workspace` is the 13th of 16 entries.
- The current implementation is `src/app/mockup/screens/phone-workspace.tsx`. It declares only `references` and `chat` substages, defaults to `phone-landscape`, and uses landscape-only geometry in both modes: a 128 px left category rail, fixed 120 px reference cards, a 240 px source/reference aside, and a single crowded composer row containing text, voice, send, and `Generate concept`.
- The current `SlimHeader` renders four fully labelled stages in one horizontal row beside the file identity. This is acceptable at 844 x 393 only with compromises and is not acceptable at 393 x 760.
- The current references footer is a selected-reference tray plus only one next button. The chat footer combines the composer and the page's primary generation action. Neither follows the application's established two-halves navigation grammar.
- `src/app/mockup/mock-ui.tsx` already exports `MockBottomNav`. Its contract explicitly says it hosts exactly two large half-width actions, and frames 10–12, 14, and 15 use it. Reuse it; do not create a competing bottom-nav implementation.
- `src/app/mockup/screens/generation-workspace.tsx` (frame 12) is the desktop source of truth for the content model: source context, direction thread and voice/text composer, categorized references, selected-reference tray, and a separate bottom navigation with `Back` / `Generate concept`.
- `src/app/mockup/screens/source-selection.tsx` (frame 11) establishes the preceding stage and the bottom action `Continue to direction`.
- `src/components/app-shell.tsx` is the production top-chrome reference: one back affordance, a concise eyebrow/title block, and few right-side controls.
- `src/app/mockup/screens/photo-capture.tsx` shows the strongest existing portrait pattern: vertically stacked content with its major actions isolated in a sticky two-column footer.
- `src/app/mockup/types.ts` currently passes only `stateId` to screens. `src/app/mockup/shell.tsx` knows the effective `viewport` but does not pass it to the screen. Therefore frame 13 cannot reliably distinguish portrait from landscape using ordinary viewport media queries because both device frames live inside the same desktop browser viewport.
- During grounding, direct navigation to `http://127.0.0.1:3000/mockup#phone-workspace` left the URL on `#phone-workspace` while the rendered controls still showed `1 / 16`. Treat reliable direct activation of frame 13 as necessary verification plumbing, not as permission to redesign the mockup shell.
- The working tree is intentionally dirty with unrelated in-progress UI work. At compilation time, `bun.lock`, `src/app/globals.css`, `src/app/mockup/mock-ui.tsx`, and multiple other mockup screens were modified, while `phone-workspace.tsx`, `types.ts`, and `shell.tsx` were clean relative to `HEAD`. Preserve all pre-existing changes byte-for-byte.
- ASSUMPTION: Portrait phone becomes frame 13's default viewport and its title/description become orientation-neutral. Landscape remains selectable in the mockup controls.
- ASSUMPTION: Frame 13 owns two editable substages: `References` and `Direction`. `Source` is the completed previous screen/stage, and `Generate` is the forward action rather than another dense content panel.
- ASSUMPTION: On References, the two bottom actions are `Back to source` and `Continue to direction`. On Direction, they are `Edit references` and `Generate concept`. This is the primary expression of the reversible mobile pipeline.
- ASSUMPTION: The portrait header shows only a back affordance, concise Atlas Image/file identity, the current stage name, and compact progress such as `2 of 3`; it does not show four full stage labels across the top.
- ASSUMPTION: The small voice/send controls remain local to the composer. `Generate concept` appears only as the right-hand major bottom action.

## Start State (verify first)

- [ ] From `C:\Users\Varshil\Desktop\Windows\Projects\aakb-atlas`, `git branch --show-current` prints `v0.2-ui`.
- [ ] `git rev-parse HEAD` prints `b70532e8d1c4a7ef0f279b989787c45ec97054dd`.
- [ ] `git diff --exit-code -- src/app/mockup/screens/phone-workspace.tsx src/app/mockup/types.ts src/app/mockup/shell.tsx` exits 0. The rest of the worktree does **not** need to be clean.
- [ ] `src/app/mockup/screens/phone-workspace.tsx` exists and contains `type SubStage = "references" | "chat"`, `w-[128px]`, `w-[240px]`, and `Generate concept`.
- [ ] `src/app/mockup/mock-ui.tsx` exists and exports `MockBottomNav`; do not edit this already-modified file.
- [ ] Read `AGENTS.md` and `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-client.md` before writing code, as required by this repository's Next.js rules.
- [ ] `bun run lint` exits 0 before changes.
- [ ] `bunx tsc --noEmit` exits 0 before changes.

## End State — Acceptance Criteria (binding)

1. Frame 13 is orientation-aware. Its default `viewport` is `phone`, its title/description describe a mobile workflow rather than landscape only, and switching the mockup control between `Phone` (393 x 760 outer frame) and `Phone landscape` (844 x 393 outer frame) renders an intentional layout for each orientation.
2. Directly loading `/mockup#phone-workspace` renders the `phone-workspace` screen and `13 / 16` controls after hydration. Fix only the minimum shell state/plumbing needed to make this reliable.
3. The portrait top bar contains exactly one back affordance and a compact identity/stage treatment. It shows Atlas Image plus the active file/project context and the current stage/progress, but does not render the current four full stage labels (`Source`, `References`, `Direction`, `Generate`) in one horizontal header row.
4. Portrait References is a single vertical stage: horizontally scrollable category controls, a responsive two-column reference grid, visible selected state, and a compact selected-reference summary/tray. The current 128 px vertical rail and fixed 120 px card layout are not used in portrait.
5. Portrait Direction is a single full-width vertical stage: compact source context, a selected-reference summary with an obvious edit path, the conversation thread, and a text/voice/send composer. The current 240 px left aside is not used in portrait, and `Generate concept` is not inside the composer row.
6. Both substages use the existing `MockBottomNav` with exactly two equal-width, full-width major actions. References shows `Back to source` / `Continue to direction`; Direction shows `Edit references` / `Generate concept`. The bottom nav remains visible while stage content scrolls.
7. Moving References → Direction → References → Direction preserves selected references, active category, and any typed-but-unsent direction draft. Switching Phone ↔ Phone landscape also preserves that state.
8. Landscape remains usable at 844 x 393: neither stage has horizontal page overflow; source/reference context and the main task are visually distinct; the two-action bottom nav is present; and no control row is clipped. It may retain a denser split layout than portrait.
9. At 393 x 760, both substages have no horizontal overflow, no overlapping fixed/sticky regions, no content hidden behind the bottom nav, and no primary action smaller than 40 px tall. Selected state and focus-visible state are perceptible in both light and dark themes.
10. The change uses existing Atlas CSS variables, existing mock data, Lucide icons, and current components. It adds no package, no service/API behavior, and no unrelated visual system.
11. `bun run lint`, `bunx tsc --noEmit`, and `bun run build` all exit 0 after the change, with no new browser console errors on frame 13.

## Non-Goals

- Do not implement real generation, uploads, persistence, routing to production stages, authentication, services, database work, or API calls.
- Do not redesign frame 12 desktop Direction & References, frame 11 Source Selection, the production pipeline page, or any other mockup screen.
- Do not redesign the floating mockup controls. Shell work is limited to reliable hash activation and passing effective viewport information to a screen.
- Do not introduce a new global design system, global responsive CSS, dependency, or bottom-navigation primitive.
- Do not edit `src/app/mockup/mock-ui.tsx`, `src/app/globals.css`, `bun.lock`, or any pre-existing modified file.
- Do not commit, stage, push, rebase, reset, discard, or reformat unrelated working-tree changes.

## Constraints

- Allowed implementation files are only:
  - `src/app/mockup/screens/phone-workspace.tsx`
  - `src/app/mockup/types.ts`
  - `src/app/mockup/shell.tsx`
- The packet and final report may be written under `.tasks/2026-07-15-redesign-frame-13-mobile-workspace/`; no other files may be created.
- Preserve every pre-existing working-tree change. Do not run a repository-wide formatter or fixer.
- Reuse `MockBottomNav` from the already-modified `mock-ui.tsx` without editing that file.
- Keep frame 13 self-contained and deterministic. Use only `mock-data.ts` data that already exists.
- Do not use browser-width media queries as a proxy for the inner device orientation. Pass or otherwise derive the mockup shell's effective `MockupViewport` explicitly so the 393 px and 844 px device frames can render different structures inside the same desktop page.
- Keep the header informational, not a second navigation surface. Back/forward editing is expressed primarily through the bottom bar.
- Respect touch ergonomics: major actions at least 40 px high; avoid hover-only removal or selection affordances in portrait.
- Do not erase useful behavior already present: reference selection, category selection, edit-references navigation, draft editing, voice/send affordances, and light/dark theme support.

## Suggested Approach (advisory)

You may deviate, but log every deviation in the report.

1. Capture `git status --short` and the diffs of the three allowed files before editing. Read `AGENTS.md`, the required local Next.js guide, `MockBottomNav`, `AppShell`, and frames 8, 11, and 12.
2. Extend `MockupScreenProps` with the effective `viewport: MockupViewport`, and have `MockupShell` pass it to the active component. Keep existing screens source-compatible; extra props can be ignored by components that do not need them.
3. Correct the initial hash/hydration state in `MockupShell` with the smallest reliable client-safe change. Do not alter the control panel's appearance or navigation semantics.
4. Rename the internal `chat` concept to `direction` if it makes the state model clearer. Lift active category, selected reference IDs, and direction draft to `PhoneWorkspaceScreen` so unmounting a stage does not discard work.
5. Replace `SlimHeader` with a compact orientation-safe mobile header: one back control, a two-line identity block, and a small current-step/progress indicator. Avoid a four-label stage row.
6. Build explicit portrait and landscape compositions from shared data/state rather than squeezing one DOM geometry into both. Recommended portrait References composition: horizontal category chips, two-column cards, compact selected tray. Recommended portrait Direction composition: compact source card, selected refs row with edit affordance, full-width thread, composer.
7. Put `MockBottomNav` at the screen level and switch its two button labels/handlers by active substage. The bottom bar must own stage progression and generation; the composer owns only drafting, voice, and sending direction messages.
8. Keep landscape denser. Reuse the content pieces, but allow a split source/context and task area where it remains legible. Do not preserve fixed widths merely because they exist today.
9. Test state retention by selecting a reference, choosing a non-default category, typing a unique draft, moving backward and forward, then switching orientations. Verify all three values remain.
10. Perform the four required visual passes (Phone References, Phone Direction, Phone landscape References, Phone landscape Direction) in both the code and browser. Fix overflow at the inner device frame, not by hiding the entire page's overflow.

## Verification

- `git diff --check -- src/app/mockup/screens/phone-workspace.tsx src/app/mockup/types.ts src/app/mockup/shell.tsx` → exits 0.
- `bun run lint` → exits 0.
- `bunx tsc --noEmit` → exits 0.
- `bun run build` → exits 0.
- `git diff --name-only -- src/app/mockup/screens/phone-workspace.tsx src/app/mockup/types.ts src/app/mockup/shell.tsx` → lists only allowed files actually changed.
- `git diff --exit-code -- src/app/mockup/mock-ui.tsx src/app/globals.css bun.lock` will not be clean because these files were already modified; instead compare their hashes or saved pre-task diffs against the pre-task capture and prove this task did not alter them.
- `rg -n "MockBottomNav|Back to source|Continue to direction|Edit references|Generate concept|viewport" src/app/mockup/screens/phone-workspace.tsx src/app/mockup/types.ts src/app/mockup/shell.tsx` → shows the viewport-aware stage and two-action contracts.
- Start or reuse the local dev server, open `http://127.0.0.1:3000/mockup#phone-workspace`, and verify the rendered controls say `13 / 16` and the screen title is frame 13.
- In `Phone`, capture `evidence/phone-references.png` and `evidence/phone-direction.png`. At 393 x 760, verify no horizontal overflow (`scrollWidth <= clientWidth` on the inner frame), bottom actions remain visible, and no content is obscured.
- In `Phone landscape`, capture `evidence/phone-landscape-references.png` and `evidence/phone-landscape-direction.png`. At 844 x 393, run the same overflow/clipping check.
- State-retention test: choose a non-default category, toggle at least one reference, type `retain-this-draft-0715`, navigate References → Direction → References → Direction, switch Phone → Phone landscape → Phone, and record evidence that category, selection, and draft all remain.
- Toggle light/dark theme while on portrait Direction and verify selected, focus-visible, secondary, and primary action states remain distinguishable.
- Record browser console errors for frame 13; expected new errors: none.

## Report Requirements

Write `report.md` next to this file, following the report template structure:
status (ACHIEVED / PARTIAL / BLOCKED), per-criterion verdict table with
evidence, files changed, deviations from suggested approach, blockers,
follow-up observations.

