[DOCS]: Adopt the git bible so every change lands through a PR
# v0.2.1 | Focus: Repository

-------------------------------- ✦ DETAILS ✦ --------------------------------

## TASKS
-----------------------------------------------------------------------------
1. Add maintain.md with section 3 of the git bible and Atlas additions.

2. Rewrite AGENTS.md with a read-first list and the repository rules.

3. Add docs/git-workflow.md for the master trunk, branch roots,
   worktrees and the merge.

4. Add a typecheck script so the gate is bun run typecheck, lint, test.



## DESCRIPTION
-----------------------------------------------------------------------------
Atlas had no written rules for branches, commits or pull requests, so
agents committed straight to master. It now follows the git bible. Each
change gets a <root>/<change> branch and a PR built from changeset.md,
then a squash merge and a tag on master.

The trunk stays master. Renaming it to main would break the remote and
open clones, so the docs tell agents to read master wherever the bible
or a skill says main.




## TECHNICAL NOTES
-----------------------------------------------------------------------------
- maintain.md copies bible section 3 verbatim, then ATLAS ADDITIONS:
  the Focus rule, the master trunk, and changeset.md as the version.

- AGENTS.md keeps the create-next-app Next.js rules block unchanged.

- Branch roots follow src/features: references, files, atlas-image,
  pipelines, auth. Type roots docs, fix and chore cover the rest.

- package.json: added "typecheck": "tsc --noEmit".

- UNVERIFIED: the gate did not run. The checkout has no node_modules,
  so tsc reports 3747 missing-module errors and eslint is not found.


-----------------------------------------------------------------------------
