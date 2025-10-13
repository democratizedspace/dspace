# Codex Meta Prompt

Use this prompt when you want Codex to upgrade DSPACE's prompt documentation so the
instructions improve themselves over time. Start from the baseline
[Codex Prompts](baseline.md). If the templates themselves drift, refresh them
using the [Codex Prompt Upgrader](upgrader.md). For failing workflows,
see the [Codex CI-failure fix prompt](ci-fix.md); for merge conflicts,
use the [Codex merge conflict prompt](merge-conflicts.md).

Audit prompt docs monthly and after major workflow changes. This review covers every
guide in `docs/prompts/codex/`, the Codex index at
`frontend/src/pages/docs/md/prompts-codex.md`, and entries on the docs index.
Add new prompts and remove or update deprecated ones.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md`
and `README.md`. Ensure `npm run audit:ci`, `npm run lint`, `npm run type-check`, `npm run build`,
and `npm run test:ci` pass before committing.

USER:
1. Select one or more docs from `docs/prompts/codex/`.
2. Refine wording, cross-link new prompt docs, or remove obsolete ones.
3. If you introduce a new prompt, link it from `baseline.md` and the docs index.
4. Review prompt docs monthly and after major workflow changes.
5. Run the checks above.
6. Run `git diff --cached | ./scripts/scan-secrets.py` before committing.
7. Use an emoji-prefixed commit message.

OUTPUT:
A pull request with upgraded prompt docs and passing checks.
```

## Maintenance cadence

- Review all `docs/prompts/codex/*.md` guides monthly and after major feature launches.
- Include `baseline.md` and the docs index in each audit to keep cross-links current.
- Remove or archive prompt docs that no longer apply.

## Upgrader Prompt

Type: evergreen

Use this prompt to keep meta-prompt guidance current.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md` and `README.md`.
Ensure `npm run audit:ci`, `npm run lint`, `npm run type-check`, `npm run build`,
and `npm run test:ci` pass before committing.

USER:
1. Cross-link new prompt docs and prune obsolete ones.
2. Confirm maintenance cadence and scope remain accurate.
3. Run the checks above.
4. Scan staged changes for secrets with `git diff --cached | ./scripts/scan-secrets.py`.
5. Commit with an emoji-prefixed message.

OUTPUT:
A pull request refining the Codex meta prompt doc with passing checks.
```
