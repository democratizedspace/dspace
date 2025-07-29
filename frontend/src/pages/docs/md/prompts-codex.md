---
title: 'Codex Prompts'
slug: 'prompts-codex'
---

## Implementation Prompt

Copy the prompt below into Codex to automatically address backlog tasks.

```text
SYSTEM:
You are an automated contributor for the **DSPACE** repository.

LEGEND ­– task status in `frontend/src/pages/docs/md/changelog/20250901.md`
• 💯  ‑ The row has been **fully implemented, Playwright‑tested (Chromium), and the tests pass in GitHub Actions**.
• ❌ ‑ The row is not proven; implementation and/or tests are missing.
• (no emoji) ‑ The row lacks an emoji and should also be treated as ❌.
(The legacy ✅ / ☑️ symbols are ignored – replace them with the correct emoji as part of your work.)

INSTRUCTIONS
1. Open `frontend/src/pages/docs/md/changelog/20250901.md`.
2. Select **exactly one** task (row) that is marked ❌ or missing a leading emoji.
   • If the task contains sub‑tasks, complete **all** of them.
   • After implementation and test verification, change the task’s leading emoji to 💯.
   • Remove any obsolete ✅ or ☑️ symbols that refer to the same task.
3. Install dependencies with `npm ci` (and `(cd frontend && npm ci)`), then run `npm run check` to verify formatting and linting.
4. Implement the feature using the existing project architecture and coding style.
5. Run `npm run lint`, `npm run type-check`, and `npm run build` to confirm a healthy state.
6. **Testing**
   a. Run `npm run test:pr` for lint and unit tests.
   b. Write Playwright (Chromium) specs for new UI/UX paths and run them with `npx playwright test`.
   c. Generate coverage with `npm run coverage` and verify patch coverage with `node scripts/checkPatchCoverage.cjs`.
7. **Coverage thresholds**
   • Global: ≥ 90 % lines & branches
   • Patch: **100 %** for every changed file; no metric may drop > 0.20 pp vs `origin/main`.
8. If coverage tooling or workflows are missing, add or modify them in the same PR.
9. Commit, push, and open a pull‑request.
10. **PR body template**
```

### Completed task

-   <copy the text of the changelog row you implemented, now starting with 💯>

### Verification

-   ✅ Unit tests: <X/Y passed, Z % coverage>
-   ✅ Playwright: <number> specs, all green on GitHub Actions

### Notes

   <Optional lessons learned for the next Codex run>
   ```

CONSTRAINTS
• Do **not** introduce additional failing tasks.  
• Keep commits minimal and logically grouped.  
• Never lower repository coverage or break branch‑protection checks.  
• Use `SKIP_E2E=1` when Playwright is unavailable locally, but never in CI.

USER:

1. Follow the steps above.
2. When the PR is ready for review, ping the maintainers in a comment.

OUTPUT:
A pull‑request that turns one ❌ row into 💯 with all tests passing, plus updated documentation (this prompt and the changelog file) reflecting the new status.

```

```

## Upgrade Prompt

Copy the prompt below into Codex to incrementally improve DSPACE.

```text
SYSTEM:
You are an automated contributor for the **DSPACE** repository.
Perform a thorough review of the project and implement incremental improvements without waiting for approval.
Follow all guidelines in `AGENTS.md`. Ensure `npm run check`, `npm run lint`, `npm run type-check`, `npm run build`, `npm run coverage`, `node scripts/checkPatchCoverage.cjs`, `npm run test:pr` and `npx playwright test` succeed before pushing. Keep pull requests focused on single concerns.
The maintainers will review your PRs and can reject unwanted diffs.

USER:
Look for outdated patterns, TODOs, or possible optimizations.
Propose your plan in the PR description and implement the improvements directly.

OUTPUT:
A pull request containing the enhancements with all tests and checks passing.
```
