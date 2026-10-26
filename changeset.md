[FIX]: Keep reference cards on screen and scrollable on phone and iPad
# v0.4.0 | Focus: Atlas image workspace and reference catalog

-------------------------------- ✦ DETAILS ✦ --------------------------------

## TASKS
-----------------------------------------------------------------------------
1. Size the Atlas image workspace to the space between the topbar and
   the bottom actions on screens 1024 px and wider.

2. Scroll the reference list inside its panel. The panel stops at 75%
   of the screen height, 720 px at most, when the panels stack.

3. Cap the direction log at 40% of the screen height when the panels
   stack.

4. Fit reference cards to the panel width, at least 140 px per card.

5. Show each reference image whole, letterboxed in a 4:3 tile.

6. Move the output quality buttons under the composer in the first
   column.

7. Let the source header wrap so "Change source" moves to its own line
   on a phone.

8. Show two catalog columns on a phone and three on a tablet, with
   whole images.



## DESCRIPTION
-----------------------------------------------------------------------------
Varshil reported that the reference cards on the Atlas image workspace
had no cut-off and no scroll at any screen size. It was worst on phone
and iPad. The reference panel grew to fit every card, so the page grew
with it. At 1024x768 the page was 1422 px tall. At 768x1024 it was
2264 px tall, with two oversized cards per row. The tiles also cropped
tall and wide images.

The workspace now fills the screen on iPad landscape and desktop. The
reference list scrolls inside its panel. On phone and iPad portrait the
panels stack, and each panel has a height limit. Images keep their full
shape, uncropped. The output quality row moved into the first column, so
the panels get its height back.

Fixes VAR-26.




## TECHNICAL NOTES
-----------------------------------------------------------------------------
- src/features/atlas-image/components/workspace.tsx: main gets
  lg:flex-none and lg:h-[calc(100dvh-var(--atlas-topbar-h)-78px)].
  With flex-1 alone, main grew past that height.

- workspace.tsx: the panel grid uses lg:grid-rows-[minmax(0,1fr)] and
  lg:min-h-[420px] in place of min-h-[560px].

- workspace.tsx: the reference grid uses
  grid-cols-[repeat(auto-fill,minmax(140px,1fr))]. The result is 2
  columns at 375 px, 4 at 768 px and 3 at 1024 px and wider.

- workspace.tsx: reference Image uses object-contain and sizes
  "(min-width: 1024px) 20vw, 50vw".

- src/features/references/reference-catalog.tsx: the grid uses
  grid-cols-2 md:grid-cols-3 lg:grid-cols-4. The img uses object-contain
  on --atlas-bg-muted.

- Checked in the browser at 375x812, 768x1024, 1024x768 and 1440x900.
  Data was a local DB copy with 12 test references from 1:5 to 3:1, up
  to 6000x4000. The document scrollWidth equals the viewport width at
  every size. The page height equals the viewport at 1024x768 and
  1440x900.

- Not checked on a real phone or iPad. UNVERIFIED with production
  reference images.

- Gate: bun run lint passes. bun run typecheck fails with TS2307 for
  bun:test in tests/*.test.ts, files this change does not touch.

- Gate: bun test gives 24 pass and 2 fail when the four files run in one
  process. The 2 failures are in milestone1 and hit live Bunny storage
  and the CLI admin token. Run alone, tests/milestone1.test.ts passes.
  The cause is INFERRED to be shared env state between test files.


-----------------------------------------------------------------------------
