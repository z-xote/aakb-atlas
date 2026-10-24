Atlas is the AAKB web app for site files, site images, the reference catalog and the Atlas image pipeline, built with Next.js, Drizzle on SQLite and a Bun CLI (`src/cli/atlas.ts`).

## Read first

1. The git bible at `/Users/varshil/Documents/Repositories/.bible.md`. Adopted the git bible on 24 October 2026.
2. `maintain.md`. How every commit is written, plus the Atlas additions.
3. `docs/git-workflow.md`. Where Atlas differs from the bible's flow.
4. `spec/` and `.tasks/atlas-v0.2/FINAL-SPEC.md` for product behaviour.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Rules

- The trunk is `master`, not `main`. Read `master` wherever the bible or a skill says `main`, including `--base` and `origin/main`.
- One branch per change, named `<root>/<change>`. The root is the feature area under `src/features`: `references`, `files`, `atlas-image`, `pipelines`, `auth`. Use a type root (`docs`, `fix`, `chore`) when no area fits.
- Every change reaches `master` as a squash-merged pull request. Every commit uses the changeset ritual in `maintain.md`.
- bun only. Never npm, pnpm or yarn.
- Gate: `bun run typecheck`, `bun run lint`, `bun test`.
- Do not start the dev server; assume `bun run dev` runs on port 3210. Do not run `bun run build` unless asked.
- The repository is public. Secrets live in `.env`, which is ignored. `.env.example` lists names only.
- Mark anything not run or read as UNVERIFIED, and anything guessed as INFERRED, in reports, changesets and docs.

Folder policy for everything outside this checkout: `/Users/varshil/.folder-conventions.md`.
