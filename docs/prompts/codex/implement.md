# Codex implement prompt for the _dspace_ repo

Use this guide when you want Codex to turn a promised but unshipped improvement into reality.
It produces a one-click, evergreen prompt that scopes the work, enforces our repo guardrails,
and nudges the agent to pick a random qualifying task each run so the backlog keeps moving.

## When to use it
- There is an explicit commitment in the repo (TODO/FIXME, unchecked checklist item, pending
  changelog entry, failing snapshot, skipped test, roadmap bullet, etc.) that describes
  behaviour we still owe.
- The promise can be fulfilled in a single pull request without blocking migrations or
  multi-week efforts.
- You can prove the behavior with automated tests (Vitest, Playwright, API tests, or a focused
  script) and update any related docs or inline notes.

## How Codex should pick a task
1. Inventory candidates by searching for TODO, FIXME, `@todo`, `skip(`, `it.skip`, "future
   work", unchecked checkboxes, or roadmap bullets. Use `rg` across the repo instead of `ls -R`
   or `grep -R`.
2. Filter out items that cannot ship in one PR or lack enough context to implement safely.
3. Select one of the remaining items at random. Record the selection criteria in the PR body so
   reviewers can follow along.
4. If no viable candidates remain, exit early and leave a note in the PR summary.

## Prompt block
```prompt
SYSTEM:
You are an automated contributor for the democratizedspace/dspace repository.

PURPOSE:
Deliver one promised or implied improvement that already exists in the codebase or docs but has
not shipped yet. Keep the change small, safe, and fully tested.

USAGE NOTES:
- Prompt name: `prompt-implement`.
- Use this prompt when clearing DSPACE TODOs, backlog bullets, unchecked checklists, or other
  explicit promises.
- Each run must choose a random eligible task so the backlog drains evenly over time.

CONTEXT:
- Follow [README.md](../../../README.md), [CONTRIBUTING.md](../../../CONTRIBUTING.md), and the
  root [AGENTS.md](../../../AGENTS.md) for semantics.
- Review [.github/workflows/](../../../.github/workflows/) before coding so local checks mirror CI.
- Reference [`llms.txt`](../../../llms.txt),
  [`docs prompt guide`](docs.md),
  and neighboring source files to understand feature intent before changing behavior.
- Tests live under [`tests/`](../../../tests/) and `frontend/__tests__/`; UI coverage uses
  Vitest and Playwright. Match existing patterns when adding new assertions.
- Install dependencies with `npm ci` (or `pnpm install`) before running repo scripts.
- Move fast but keep trunk green: ship small, composable changes that pass CI on the first push.

REQUEST:
1. Build a candidate list of promised-but-unshipped work (TODO/FIXME, unchecked checklists,
   skipped tests, roadmap bullets, etc.) using `rg`. Exclude items that need multi-step
   migrations or cross-team approvals.
2. Choose one remaining candidate at random and state the choice (and why it qualifies) in the
   PR summary.
3. Add or update automated tests so the expectation fails first, then implement the minimal code
   to make them pass. Extend coverage for edge cases when feasible.
4. Update or remove the original promise (TODO comment, checklist entry, doc note) so the repo no
   longer advertises incomplete work.
5. Refresh related documentation or changelog entries to reflect the shipped behavior. When
   touching the changelog, do **not** create a new dated file—append your notes to the most
   recent future-dated entry instead (for example,
   [`frontend/src/pages/docs/md/changelog/20251101.md`](../../../frontend/src/pages/docs/md/changelog/20251101.md)
   on the `v3` branch). Never rewrite the body of published changelog markdown; use
   `frontend/src/utils/changelogNotes.ts` to append clarifying notes and reserve direct edits for
   spelling, whitespace, or broken link fixes recorded in
   `frontend/tests/fixtures/changelogCorrections.json`.
6. Run `npm run audit:ci`, `npm run lint`, `npm run type-check`, `npm run build`, and
   `npm run test:ci`. Install Playwright browsers with
   `npx playwright install chromium` if needed, or set `SKIP_E2E=1` only when browsers are
   unavailable.
7. Scan staged changes with `git diff --cached | ./scripts/scan-secrets.py` before committing.
8. Commit with an emoji-prefixed message and summarize the implemented promise plus test results
   in the PR body.

OUTPUT:
A pull request implementing the randomly selected promise, with updated docs, green checks, and
notes describing the selection process and test outcomes.
```

## Upgrade instructions
```upgrade
SYSTEM:
You are an automated contributor for the democratizedspace/dspace repository.

PURPOSE:
Keep `docs/prompts/codex/implement.md` accurate, actionable, and aligned with the
[docs prompt guide](docs.md).

USAGE NOTES:
- Use this block when refining or expanding the DSPACE implement prompt.
- Ensure cross-references to other prompt docs and indexes stay in sync.

CONTEXT:
- Follow [README.md](../../../README.md), [CONTRIBUTING.md](../../../CONTRIBUTING.md), and the root
  [AGENTS.md](../../../AGENTS.md) for instruction semantics.
- Review [.github/workflows/](../../../.github/workflows/) to anticipate CI checks.
- Run the command suite from the main prompt (`npm run audit:ci`, `npm run lint`,
  `npm run type-check`, `npm run build`, `npm run test:ci`) plus the secret scan
  `git diff --cached | ./scripts/scan-secrets.py`.
- Confirm new guidance matches the latest patterns in `docs/prompt-docs-summary.md` and related
  prompt docs.

REQUEST:
1. Update this file so the implement prompt stays evergreen and mirrors current repo workflows.
2. Verify all referenced files exist and links resolve.
3. Document notable changes in the PR body and ensure the commands above pass.

OUTPUT:
A pull request updating `docs/prompts/codex/implement.md` with refreshed guidance and passing
checks.
```
