---
title: 'Codex Merge Conflict Prompt'
slug: 'prompts-codex-merge-conflicts'
---

# Codex merge conflict prompt

Use this template when a pull request has merge conflicts and you want Codex to
resolve them. The snippet is designed for 2-click use: copy the conflict block
from GitHub, paste it into ChatGPT, and then paste the returned, conflict-free
block back into the UI. For large files GitHub may show only a subset of lines;
always return exactly what you received with the conflicts resolved and no
extra formatting.

> **TL;DR**
>
> 1. Copy the conflict block from the GitHub merge UI.
> 2. Paste it into a ChatGPT message.
> 3. The agent replies with the same text but conflicts resolved—ready to paste back.
> 4. Run `npm run audit:ci`, `npm run lint`, `npm run type-check`, `npm run build`, and
>    `npm run test:ci`.
> 5. Scan staged changes with `git diff --cached | ./scripts/scan-secrets.py` and commit
>    with an emoji prefix.

```text
Please resolve the merge conflicts in the code block below by returning a code
block with the exact same content (no formatting or lint fixes) but with the
conflicts resolved. In future messages, I'll provide additional conflict blocks;
follow the same approach for each.
```

## Upgrade Prompt

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md`
and `README.md`. Ensure `npm run audit:ci`, `npm run lint`, `npm run type-check`,
`npm run build`, and `npm run test:ci` pass before committing.

USER:
1. Refine `frontend/src/pages/docs/md/prompts-codex-merge-conflicts.md` for
   clarity and 2-click accuracy.
2. Update related docs and links if needed.
3. Run the checks above.
4. Scan for secrets with `git diff --cached | ./scripts/scan-secrets.py`.
5. Use an emoji-prefixed commit message.

OUTPUT:
A pull request improving the merge conflict prompt doc with passing checks.
```

## Upgrader Prompt

Type: evergreen

Use this prompt to keep merge-conflict resolution tips current.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md` and `README.md`.
Ensure `npm run audit:ci`, `npm run lint`, `npm run type-check`, `npm run build`,
and `npm run test:ci` pass before committing.

USER:
1. Verify steps match current GitHub merge UI and git CLI behavior.
2. Add guidance for large files or binary conflicts when relevant.
3. Run the checks above.
4. Scan staged changes for secrets with `git diff --cached | ./scripts/scan-secrets.py`.
5. Commit with an emoji-prefixed message.

OUTPUT:
A pull request refining the merge-conflict prompt doc with passing checks.
```
