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
