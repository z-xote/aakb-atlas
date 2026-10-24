# Git workflow

Atlas follows section 4 of the git bible,
`/Users/varshil/Documents/Repositories/.bible.md`. This page lists only
what Atlas changes.

## Trunk

The trunk is `master`. Every bible command that names `main` uses
`master` here:

```bash
git fetch origin
git switch master && git pull --ff-only
git switch -c references/card-overflow
```

```bash
conv=~/.claude/skills/file-pr/scripts/changeset-to-pr.py
gh pr create --base master \
  --title "$(python3 -I "$conv" changeset.md --title --branch "$(git branch --show-current)")" \
  --body "$(python3 -I "$conv" changeset.md --body --filed-by "<model> in <harness>")"
```

## Branch roots

| Root | Area |
|---|---|
| `references` | Reference catalog, `src/features/references` |
| `files` | Files, site images, the file wizard, `src/features/files` |
| `atlas-image` | Atlas image pipeline and workspace |
| `pipelines` | Pipeline list and shared pipeline code |
| `auth` | Device login, PIN, sessions |
| `docs`, `fix`, `chore` | Changes with no single area |

## Worktrees

A branch gets a sibling worktree named `aakb-atlas-<slug>`:

```bash
git worktree add ../aakb-atlas-card-overflow references/card-overflow
```

Each worktree needs its own `bun install`. Never share `data/*.sqlite`
between branches that carry different migrations.

## Merge

```bash
gh pr merge <n> --squash --delete-branch \
  --subject "$(head -n1 changeset.md)" --body "$(tail -n +2 changeset.md)"
git switch master && git pull --ff-only
git tag v{VERSION} && git push origin v{VERSION}
```
