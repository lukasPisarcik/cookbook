# Changesets

This folder collects unreleased changes. Add a changeset for every user-facing change:

```bash
bun changeset
```

Pick a bump type (patch / minor / major), summarize the change, commit the resulting `*.md` file alongside your code change. CI verifies that branches modifying source code include a changeset.

When releasing, `bun changeset version` rolls accumulated changesets into the changelog and bumps `package.json`. See [Changesets docs](https://github.com/changesets/changesets).
