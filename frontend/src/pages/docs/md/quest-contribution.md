---
title: 'Quest Contribution Guidelines'
slug: 'quest-contribution'
---

# Quest Contribution Guidelines

These guidelines outline the process for contributing your custom quests to the official DSPACE repository.

## Prerequisites

- [Quest Development Guidelines](/docs/quest-guidelines)
- Familiarity with [Quest Trees](/docs/quest-trees)
- Node.js environment with this repository cloned
- Review the [Quest Template Example](/docs/quest-template)

## Workflow

1. **Generate a template**
    ```bash
    cd frontend
    npm run generate-quest --template basic
    ```
    Use `branching` instead of `basic` for multi-path quests.
2. **Build your quest** following the [Quest Schema](/docs/quest-schema). Include at least one item or process reference.
3. **Run validations**
    ```bash
    node scripts/validate-quest.js path/to/quest.json
    ```
    If you're updating quests inside this repository, also run `npm run test:root -- questDependencies`
    to confirm there are no missing or circular dependencies.
4. **Bundle related content**
    ```bash
    node scripts/create-content-bundle.js submissions/bundles/my-bundle.json path/to/quest.json --items path/to/item.json --processes path/to/process.json
    ```
    This creates a JSON bundle in `submissions/bundles`. See
    [Custom Content Bundles](/docs/custom-bundles) for more examples.
5. **Submit via the in-game form** at `/quests/submit` for quest-only JSON or
   `/bundles/submit` for bundles (see the [Quest Submission Guide](/docs/quest-submission)).
6. **Authorize GitHub** with a personal access token and create a pull request.
7. **Respond to feedback** until the quest meets project standards.

## Tips

- Keep dialogue concise and educational.
- Include safety notes where appropriate.
- Run `npm test` before opening a pull request (use `SKIP_E2E=1 npm test` only if browsers are unavailable).

Happy quest building!
