---
title: 'Codex Prompt Library'
slug: 'prompts-codex'
---

# Codex prompt library for the _dspace_ repo

All detailed Codex prompt guides now live in the repository under
[`docs/prompts/codex/`](https://github.com/democratizedspace/dspace/tree/main/docs/prompts/codex).
This page stays in the in-game handbook as a quick index so contributors can jump straight to the
canonical Markdown files and keep them in sync.

> **Need a prompt fast?** Browse the list below, open the linked Markdown file in GitHub, and copy
> the snippet you need. Each guide follows the same conventions: scope work to one or two files, be
> explicit about tests to run, stop the prompt when the spec is complete, and scan staged changes
> with `./scripts/scan-secrets.py` before committing.

## Canonical prompt guides

-   **Core workflow:** [Codex prompt playbook][codex-playbook]
-   **Repository maintenance:** [Codex meta prompt][meta]
-   **Prompt upgrader:** [Codex prompt upgrader][upgrader]
-   **Implementation prompt:** [Ship a promised feature][implementation]
-   **Upgrade prompt:** [Repository sweep][upgrade]
-   **CI failures:** [Codex CI-failure fix][ci-fix]
-   **Merge conflicts:** [Codex merge conflict prompt][merge]
-   **Outages:** [Outage prompts][outages]
-   **Backups:** [Backup prompts][backups]
-   **Monitoring:** [Monitoring prompts][monitoring]
-   **Dependency audits:** [Audit prompts][audit]
-   **Secret scanning:** [Secrets prompts][secrets]
-   **Backend work:** [Backend prompts][backend]
-   **Frontend work:** [Frontend prompts][frontend]
-   **Accessibility:** [Accessibility prompts][accessibility]
-   **Chat UI:** [Chat UI prompts][chat-ui]
-   **Vitest tests:** [Vitest prompts][vitest]
-   **Playwright tests:** [Playwright prompts][playwright]
-   **Refactors:** [Refactor prompts][refactors]
-   **Docs & JSDoc:** [Docs prompts][docs]
-   **Processes:** [Process prompts][processes]
-   **Items:** [Item prompts][items]
-   **Quests:** [Quest prompts][quests]
-   **NPCs:** [NPC prompts][npcs]

## Keeping the library current

1. Update or add prompt docs directly in `docs/prompts/codex/`.
2. Refresh the list above whenever a file is added, renamed, or removed.
3. Link new prompt docs from other guides (for example, the quest template) using the GitHub URLs
   below so players always land on the canonical copy.
4. Run `git diff --cached | ./scripts/scan-secrets.py` before committing prompt changes.

Have ideas for improving the prompts? Open a pull request that updates the Markdown in
`docs/prompts/codex/` and mention it in the weekly docs review.

[codex-playbook]: https://github.com/democratizedspace/dspace/blob/main/docs/prompts/codex/prompts-codex.md
[meta]: https://github.com/democratizedspace/dspace/blob/main/docs/prompts/codex/prompts-codex-meta.md
[upgrader]: https://github.com/democratizedspace/dspace/blob/main/docs/prompts/codex/prompts-codex-upgrader.md
[ci-fix]: https://github.com/democratizedspace/dspace/blob/main/docs/prompts/codex/prompts-codex-ci-fix.md
[merge]: https://github.com/democratizedspace/dspace/blob/main/docs/prompts/codex/prompts-codex-merge-conflicts.md
[outages]: https://github.com/democratizedspace/dspace/blob/main/docs/prompts/codex/prompts-outages.md
[backups]: https://github.com/democratizedspace/dspace/blob/main/docs/prompts/codex/prompts-backups.md
[monitoring]: https://github.com/democratizedspace/dspace/blob/main/docs/prompts/codex/prompts-monitoring.md
[audit]: https://github.com/democratizedspace/dspace/blob/main/docs/prompts/codex/prompts-audit.md
[secrets]: https://github.com/democratizedspace/dspace/blob/main/docs/prompts/codex/prompts-secrets.md
[backend]: https://github.com/democratizedspace/dspace/blob/main/docs/prompts/codex/prompts-backend.md
[frontend]: https://github.com/democratizedspace/dspace/blob/main/docs/prompts/codex/prompts-frontend.md
[accessibility]: https://github.com/democratizedspace/dspace/blob/main/docs/prompts/codex/prompts-accessibility.md
[chat-ui]: https://github.com/democratizedspace/dspace/blob/main/docs/prompts/codex/prompts-chat-ui.md
[vitest]: https://github.com/democratizedspace/dspace/blob/main/docs/prompts/codex/prompts-vitest.md
[playwright]: https://github.com/democratizedspace/dspace/blob/main/docs/prompts/codex/prompts-playwright-tests.md
[refactors]: https://github.com/democratizedspace/dspace/blob/main/docs/prompts/codex/prompts-refactors.md
[docs]: https://github.com/democratizedspace/dspace/blob/main/docs/prompts/codex/prompts-docs.md
[processes]: https://github.com/democratizedspace/dspace/blob/main/docs/prompts/codex/prompts-processes.md
[items]: https://github.com/democratizedspace/dspace/blob/main/docs/prompts/codex/prompts-items.md
[quests]: https://github.com/democratizedspace/dspace/blob/main/docs/prompts/codex/prompts-quests.md
[npcs]: https://github.com/democratizedspace/dspace/blob/main/docs/prompts/codex/prompts-npcs.md
[implementation]: https://github.com/democratizedspace/dspace/blob/main/docs/prompts/codex/implement.md
[upgrade]: https://github.com/democratizedspace/dspace/blob/main/docs/prompts/codex/prompts-codex.md#upgrade-prompt
