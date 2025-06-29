# AGENT INSTRUCTIONS

## Scope

These guidelines apply to all files in this repository.

## Development

-   Before submitting a pull request, run `npm run test:pr` to execute lint, unit and e2e tests.
-   If E2E tests complain that the browser executable is missing, run `npx playwright install` to download the required browsers.
-   If Playwright browsers aren't available, prefix the command with `SKIP_E2E=1`.
-   Use `npm run check` to verify formatting and linting prior to commit.
-   If these checks fail due to missing dev dependencies, mention the error in
    your pull request summary.
-   If ESLint reports missing plugins, run `npm install` in both the repo root and the `frontend` directory to restore dev dependencies.
-   If dependencies seem missing or tests fail immediately, run `npm ci` in the repo root and `(cd frontend && npm ci)` to reinstall packages.
-   If formatting fails, run `npx prettier` on the affected files before
    committing.
-   The lint script sets `ESLINT_USE_FLAT_CONFIG=false`. If you run ESLint
    manually, be sure to export this variable so the old `.eslintrc.json` works.
-   Keep documentation up to date when adding or changing features.
-   Built-in quest files live in `frontend/src/pages/quests/json`. Maintain the schema in
    `frontend/src/pages/quests/jsonSchemas` when adding quests.
-   Ensure quest dialogue contains at least a start, middle, and completion node
    with at least one option per node.
-   Include a `finish` option in the final node so quests end cleanly. Quests
    without a finish option will fail canonical tests.
-   For rapid quest creation, reference `frontend/src/pages/docs/md/prompts-quests.md`
    which contains AI prompt templates, including a **Quest Sequence Expansion**
    section for brainstorming follow-up quests.
-   When generating dialogue with an LLM, consult the biography and sample
    quotes in `frontend/src/pages/docs/md/npcs.md` so the character voice stays
    consistent. Each NPC entry lists at least five example lines harvested from
    existing quests. Keep these examples updated when quests change.
-   Review `frontend/src/pages/docs/md/quest-submission.md` for the submission workflow when contributing new quests.
-   See `frontend/src/pages/docs/md/quest-template.md` for a minimal quest JSON template that works with [token.place](https://github.com/futuroptimist/token.place).
-   Document any new or updated NPCs in `frontend/src/pages/docs/md/npcs.md`.
-   Update quest progression tests in `frontend/__tests__/questQuality.test.js`
    when introducing new aquaria quests or changing their order.
-   Provide simple Jest tests for any new Svelte components under
    `frontend/__tests__` to help maintain Codecov coverage.
-   Avoid committing large binary assets (e.g., PSD files). Convert graphics to
    optimized formats before adding them to the repo.
-   Continuous integration runs `npm run test:pr` on pushes and pull requests.
    Coverage uploads to Codecov when the `CODECOV_TOKEN` secret is set. You'll
    see the results in the **Checks** tab of your PR. Ensure the README's Codecov badge tracks the `v3` branch so it reflects CI results.
    Run `npm run coverage` locally to generate a detailed report before submitting changes.
-   Archive deprecated quests by moving them to `frontend/src/pages/quests/archive`.
-   token.place only provides open-source LLM inference. It does not host quests, but you can reuse the same prompts to generate dialogue here or in other projects.
-   After merging, run `npm ci` in the repo root and `(cd frontend && npm ci)` to
    restore a clean state before validating quests.
-   To grow the quest tree across repositories, use token.place prompts to reuse
    dialogue or items from sibling projects.
-   Quest JSON files are compatible with the [token.place](https://github.com/futuroptimist/token.place) project, so feel free to share content across repos.
-   The `test:pr` and `test:e2e:groups` scripts automatically start the dev
    server. Avoid starting it manually unless running Playwright directly.
-   When adding inventory items in `frontend/src/pages/inventory/json/items.json`, assign the next numeric `id` and provide an image if possible.
-   Update `frontend/__tests__/itemQuality.test.js` when adding items so the quality ratio stays accurate.
-   Update `frontend/__tests__/processQuality.test.js` when introducing new processes or unusual durations.
-   If you add a quest that changes the tech tree order, document the new sequence in `README.md` and update `frontend/__tests__/questQuality.test.js` accordingly.
-   Summarize new categories in `frontend/src/pages/docs/md/quest-trees.md` when they are introduced.

## Pull Request Message

Include a short summary of changes and note whether tests succeeded or failed.
