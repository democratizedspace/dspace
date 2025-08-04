---
title: 'Quest Contribution Guidelines'
slug: 'quest-contribution'
---

# Quest Contribution Guidelines

These guidelines outline the process for contributing your custom quests to the official DSPACE repository.

## Prerequisites

-   [Quest Development Guidelines](/docs/quest-guidelines)
-   Node.js environment with this repository cloned

## Workflow

1. **Generate a template**
    ```bash
    npm run generate-quest --template basic
    ```
    Use `branching` instead of `basic` for multi-path quests.
2. **Build your quest** following the [Quest Schema](/docs/quest-schema). Include at least one item or process reference.
3. **Run validations**
    ```bash
    npm test -- questValidation
    npm test -- questQuality
    npm test -- questSimulation
    ```
4. **Bundle related content**
    ```bash
    node scripts/create-content-bundle.js
    ```
    This creates a JSON bundle in `submissions/bundles`.
5. **Submit via the in-game form** at `/quests/submit`.
6. **Authorize GitHub** with a personal access token and create a pull request.
7. **Respond to feedback** until the quest meets project standards.

## Tips

-   Keep dialogue concise and educational.
-   Include safety notes where appropriate.
-   Run `SKIP_E2E=1 npm run test:pr` before opening a pull request.

Happy quest building!
