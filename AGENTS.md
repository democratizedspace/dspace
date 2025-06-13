# AGENT INSTRUCTIONS

## Scope

These guidelines apply to all files in this repository.

## Development

-   Before submitting a pull request, run `npm run test:pr` to execute lint, unit and e2e tests.
-   If E2E tests complain that the browser executable is missing, run `npx playwright install` to download the required browsers.
-   If that command fails (e.g., due to network restrictions) or browsers still aren't available, prefix `npm run test:pr` with `SKIP_E2E=1` and note the issue in your PR summary.
-   Use `npm run check` to verify formatting and linting prior to commit.
-   If these checks fail due to missing dev dependencies, mention the error in
    your pull request summary.
-   If ESLint reports missing plugins, run `npm install` in both the repo root
    and the `frontend` directory to restore dev dependencies.
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
    which contains AI prompt templates.
-   Document any new or updated NPCs in `frontend/src/pages/docs/md/npcs.md`.
-   Update quest progression tests in `frontend/__tests__/questQuality.test.js`
    when introducing new aquaria quests or changing their order.
-   Avoid committing large binary assets (e.g., PSD files). Convert graphics to
    optimized formats before adding them to the repo.
-   Continuous integration runs `npm run check` and `npm test -- --coverage` via
    GitHub Actions.
-   Archive deprecated quests by moving them to `frontend/src/pages/quests/archive`.
-   token.place only provides open-source LLM inference. It does not host quests, but you can reuse the same prompts to generate dialogue here or in other projects.
-   The [f2clipboard](https://github.com/futuroptimist/f2clipboard) tool can speed
    up copying quest prompts and snippets between projects.
    `npm ci` and `(cd frontend && npm ci)` after merging to ensure a clean state.
    to verify the dialogue structure is valid.
-   Quest JSON files are compatible with the [token.place](https://github.com/futuroptimist/token.place) project, so feel free to share content across repos.
-   The `test:pr` and `test:e2e:groups` scripts automatically start the dev
    server. Avoid starting it manually unless running Playwright directly.
-   When adding inventory items in `frontend/src/pages/inventory/json/items.json`, assign the next numeric `id` and provide an image if possible.
-   When adding or removing Playwright spec files, update the groups in
    `frontend/scripts/run-test-groups.mjs` so CI runs the correct tests.

## Pull Request Message

Include a short summary of changes and note whether tests succeeded or failed.
