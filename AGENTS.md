# AGENT INSTRUCTIONS

## Scope

These guidelines apply to all files in this repository.

## Development

-   Before submitting a pull request, run `npm run test:pr` to execute lint, unit and e2e tests.
-   Use `npm run check` to verify formatting and linting prior to commit.
-   Keep documentation up to date when adding or changing features.
-   Built-in quest files live in `src/pages/quests/json`. Maintain the schema in
    `src/pages/quests/jsonSchemas` when adding quests.
-   Ensure quest dialogue contains at least a start, middle, and completion node
    with at least one option per node.
-   Document any new or updated NPCs in `src/pages/docs/md/npcs.md`.

## Pull Request Message

Include a short summary of changes and note whether tests succeeded or failed.
