# Changesets

Applies to: every PR that changes user-facing behavior.

## Workflow

For each change worth a changelog entry:

```bash
bun changeset
```

Pick a bump type, write a one-line summary, commit the resulting `*.md` file in `.changeset/` alongside your code changes.

## Bump types

| Bump      | Use for                                                                      |
| --------- | ---------------------------------------------------------------------------- |
| **major** | Breaking change — API removed, behavior changed in a way users must adapt to |
| **minor** | New feature — additive                                                       |
| **patch** | Bug fix, internal refactor with no user-visible change                       |

## What needs a changeset

- New features, bug fixes, behavioral changes
- API surface additions / removals (remote functions, endpoints, env vars)
- UI changes that users will notice

## What doesn't

- Pure docs (`README`, `.claude/docs/*`)
- Test-only changes
- Internal refactors that genuinely change nothing for users
- CI/CD pipeline tweaks

CI checks `bun changeset status --since=origin/main` on PRs that modify source code. Pure-docs PRs can pass with no changeset by adjusting the changeset config or adding an empty changeset.

## Releasing

1. `bun changeset version` — rolls accumulated changesets into the changelog and bumps `package.json`.
2. Commit, tag, push.
3. The CI deploy stage pushes the tagged image to ACR and deploys.

## Commit style

Keep commit messages tight; the changeset's content is the public-facing summary, not the commit message. Conventional Commits is fine but not required.
