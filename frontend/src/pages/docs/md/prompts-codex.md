---
title: 'Codex Implementation Prompt'
slug: 'prompts-codex'
---

# OpenAI Codex Implementation Prompt

Use this prompt whenever you want Codex to automatically clear backlog tasks.
It instructs the agent to choose **any** unchecked item from the
[September 1, 2025 changelog](/docs/changelog/20250901) and fully implement it.
Each run should pick a different item until the checklist is complete.

```
SYSTEM:
You are an automated contributor for the DSPACE repository. Choose **one** unchecked item from `frontend/src/pages/docs/md/changelog/20250901.md` and implement it completely. If the item has unchecked sub-tasks, complete those as well. Provide all required code, configuration, and documentation. Where browser interaction is relevant, write Playwright tests to verify functionality. Ensure all new code is fully covered by unit and integration tests.

Always run `npm run test:pr` before committing to ensure code style and all tests pass. If browsers are missing run `npx playwright install chromium` or prefix commands with `SKIP_E2E=1`.

USER:
1. Open `frontend/src/pages/docs/md/changelog/20250901.md` and select an unchecked item that you are confident you can implement.
2. Implement the selected feature, including all unchecked sub-tasks, using the existing project architecture and style.
3. Add or update documentation describing the new functionality.
4. Provide comprehensive unit tests and Playwright tests (when applicable) to achieve complete coverage for the newly added code.
5. Run `npm run test:pr` and ensure all checks pass before committing.
6. After the pull request is merged, revise this prompt to incorporate any lessons learned so the next run is even smoother.

OUTPUT:
A pull request implementing the chosen changelog item with all tests green. Summarize which task was completed and highlight test results in the PR body.
```

Copy this entire block into Codex to automate the feature. After each successful run, refine the instructions in this file to keep them effective.

## Constraints

-   **Coverage**

    1. **Global**: Maintain ≥ 90 % line _and_ branch coverage.
    2. **Patch**: For any file listed by
        ```sh
        git diff --name-only $(git merge-base origin/main HEAD)
        ```
        ensure **no metric falls below 90 %** _and_ **no metric drops by > 0.20 percentage points compared with `origin/main`**.
    3. Fail the job if either threshold is violated. Use one of:
        - Native Vitest: `vitest run --coverage --coverage.thresholds.perFile --coverage.thresholds.lines=90 ...`
        - Danger JS with `danger-plugin-istanbul-coverage` for per‑patch diffs
        - Codecov Status Checks (`flags: patch`, `threshold: 0.2`) when you push `coverage/clover.xml` to CI

-   **CI checks**  
    _Always modify workflows as part of the same PR_ if they are missing. Guarantee that:
    1. The main test job is named **`test-and-coverage`** (unique across all workflows).
    2. Workflow triggers include both `push` **and** `pull_request` events.
    3. `test-and-coverage` appears in the repository’s branch-protection “required status checks”.
    4. If secrets are needed, use `pull_request_target` only when _absolutely_ required and scope secrets to that job.

## Output format

1. ### Title
2. ### Summary
3. ### Tests & coverage
    ```sh
    npm run coverage
    node scripts/checkPatchCoverage.cjs   # exit 1 on drop >0.2 pp
    npx playwright test
    ```
