# AGENT INSTRUCTIONS

## Scope

These guidelines apply to all files in this repository.

## Development

-   Before submitting a pull request, run `npm run test:pr` to execute lint, unit and e2e tests.
-   Use `npm run check` to verify formatting and linting prior to commit.
-   Keep documentation up to date when adding or changing features.
-   Built-in quest files live in `frontend/src/pages/quests/json`. Maintain the schema in
    `frontend/src/pages/quests/jsonSchemas` when adding quests.
-   Ensure quest dialogue contains at least a start, middle, and completion node
    with at least one option per node.
-   Include a `finish` option in the final node so quests end cleanly. Quests
    without a finish option will fail canonical tests.
-   Document any new or updated NPCs in `frontend/src/pages/docs/md/npcs.md`.
-   Update quest progression tests in `frontend/__tests__/questQuality.test.js`
    when introducing new aquaria quests or changing their order.
-   Avoid committing large binary assets (e.g., PSD files). Convert graphics to
    optimized formats before adding them to the repo.
-   Continuous integration runs `npm run check` and `npm test -- --coverage` via
    GitHub Actions.
-   Archive deprecated quests by moving them to `frontend/src/pages/quests/archive`.

## Pull Request Message

Include a short summary of changes and note whether tests succeeded or failed.
