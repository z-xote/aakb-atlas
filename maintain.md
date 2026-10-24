# CHANGESET INSTRUCTIONS
# Base: section 3 of the git bible, /Users/varshil/Documents/Repositories/.bible.md,
# adopted 24 October 2026. ATLAS ADDITIONS below win where they differ.

`changeset.md` is the commit message. Every commit uses it:

```bash
git commit -F changeset.md
```

Each commit:

1. Delete the existing `changeset.md`.
2. Write a new one in the format below.
3. Bump the version (rules below).
4. Run the `unslop` skill over the draft and apply what it flags.
5. Re-check the 75-character rule, since unslop edits change lengths.

The `changeset` skill does all five.

### Version

Format `v{MAJOR}.{MINOR}.{PATCH}`. One version for the whole repository.

- PATCH: typo fixes, comment updates, docs-only changes, style or
  formatting with no logic impact, config or CI with no user-facing effect.
- MINOR: new features, refactors, performance work, tests, dependency
  updates, non-breaking security fixes, any bug fix.
- MAJOR: breaking changes to an API, interface or behaviour; removing or
  renaming public functionality; anything that makes consumers update.

When in doubt, minor.

On `main`, the version is the next tag and the tag is cut right after the
commit. On a work branch, the version is the one `main` will carry after
the branch squash-merges; every commit on the branch repeats it and
nothing is tagged. The tag is cut on `main` after the merge. Never tag a
branch commit.

### Format

Every line inside DETAILS is 75 characters or fewer, no exceptions. Fix an
overlong line by splitting it into two bullets, never by trimming meaning.

```
[TAG]: Title of change
# v{VERSION} | Focus: {focus area}

-------------------------------- ✦ DETAILS ✦ --------------------------------

## TASKS
-----------------------------------------------------------------------------
1. First task

2. Second task

3. Third task



## DESCRIPTION
-----------------------------------------------------------------------------
Description goes here (wrap at 75 chars, no exceptions)




## TECHNICAL NOTES
-----------------------------------------------------------------------------
- Technical note 1

- Technical note 2


-----------------------------------------------------------------------------
```

- The title says why the change matters, in words a person skimming a
  commit list can use. "Cut pill startup to under 200 ms" beats "Refactor
  pill mount sequence". It becomes the PR title and the squash subject.
- `Focus:` names the area touched. The repository's additions say how
  (monorepo root, screen name, package).
- TASKS are commands that describe what the code does now, not what was
  intended: "Add a null guard in getUserId()".
- DESCRIPTION opens with the problem as the user would describe it, then
  the solution and why this fix is the right one, or what it does not fix.
- TECHNICAL NOTES carry the inventory: files, functions, constants,
  commands run, numbers seen.

### Tags

| Tag | Use |
|---|---|
| [FEATURE] | New functionality |
| [FIX] | Bug fix |
| [REFACTOR] | Restructuring without behaviour change |
| [PERF] | Performance |
| [DOCS] | Documentation only |
| [STYLE] | Formatting only |
| [TEST] | Tests added or changed |
| [CHORE] | Maintenance |
| [BREAKING] | Breaks backward compatibility |
| [WIP] | Not complete yet; branch commits only, never on main |
| [SECURITY] | Security change or fix |
| [REVERT] | Reverts a commit |
| [CI] | CI configuration |
| [CONFIG] | Configuration |
| [DEPS] | Dependency updates |

### Checklist

- [ ] The tag is right and the bump is right.
- [ ] Every line in DETAILS is 75 characters or fewer.
- [ ] TASKS reflect the diff, not the plan.
- [ ] DESCRIPTION is plain language, no jargon dumps.
- [ ] TECHNICAL NOTES name specific files and functions.
- [ ] The old `changeset.md` was deleted first.
- [ ] unslop pass done, then line lengths re-checked.
- [ ] Staged explicit paths, never `git add .` or `-A`. No `.env`, keys
      or credentials.

## ATLAS ADDITIONS

- `Focus:` names the screen or feature area the change touches, in words
  a person uses: "Reference catalog", "Atlas image workspace", "Device
  login", "File wizard". Use "Repository" for docs and tooling changes.
- The trunk is `master`. Read `master` wherever the bible or a skill says
  `main`.
- One version for the whole app. The version in `changeset.md` is the
  source of truth; `package.json` is not kept in step.
