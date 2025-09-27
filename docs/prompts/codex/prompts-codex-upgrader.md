# Codex Prompt Upgrader

Use this meta prompt whenever the Codex templates need refreshing. It tracks new prompt
types and required checks so the machine that builds the machine stays current. Keep
each change scoped and easy to revert. See
[Codex Prompts](prompts-codex.md) for the baseline templates, the
[Codex Meta Prompt](prompts-codex-meta.md) for routine maintenance, the
[Codex CI-failure fix prompt](prompts-codex-ci-fix.md) for troubleshooting failing
workflows, and the [Codex merge conflict prompt](prompts-codex-merge-conflicts.md)
for resolving conflicts.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md` and
`README.md`. Ensure `npm run lint`, `npm run type-check`, `npm run build`, and
`npm run test:ci` all pass before committing.

USER:
1. Audit `docs/prompts/codex/*.md` for stale guidance, missing cross-links,
   or unlisted prompt types.
2. Use `rg` for file searches; avoid `ls -R` or `grep -R`.
3. Make minimal, reversible edits that update templates and required checks
   (`npm run lint`, `npm run type-check`, `npm run build`, `npm run test:ci`).
4. Link new prompt files from this folder and refresh
   `frontend/src/pages/docs/md/prompts-codex.md`.
5. Run `git diff --cached | ./scripts/scan-secrets.py` before committing.
6. Run the checks above.
7. Use an emoji-prefixed commit message.

OUTPUT:
A pull request refreshing the Codex prompt docs with passing checks.
```

## Upgrader Prompt

Type: evergreen

Use this prompt to keep upgrader instructions current with all prompt types and checks.
It summarizes the standard checks (`npm run lint`, `npm run type-check`,
`npm run build`, `npm run test:ci`, and secret scanning) so upgrades always include
them.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md` and `README.md`.
Ensure `npm run lint`, `npm run type-check`, `npm run build`,
and `npm run test:ci` pass before committing.

USER:
1. Reference new prompt types (for example, merge conflicts) and list all required checks.
2. Use `rg` for file searches; avoid `ls -R` or `grep -R`.
3. Tighten language so upgrades stay precise and reversible.
4. Run the checks above (`npm run lint`, `npm run type-check`, `npm run build`, `npm run test:ci`).
5. Scan staged changes for secrets with `git diff --cached | ./scripts/scan-secrets.py`.
6. Commit with an emoji-prefixed message.

OUTPUT:
A pull request refining the Codex Prompt Upgrader doc with passing checks.
```
