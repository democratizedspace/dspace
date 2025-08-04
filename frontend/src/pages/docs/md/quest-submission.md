---
title: 'Quest Submission Guide'
slug: 'quest-submission'
---

# Quest Submission Guide

This guide describes how to submit your custom quests to become part of the official DSPACE release.

## Prerequisites

-   Familiarity with the [Quest Development Guidelines](/docs/quest-guidelines)
-   A local copy of this repository with all dependencies installed

## Steps

1. **Create your quest** using the in-game editor or by editing a JSON file under `frontend/src/pages/quests/json`. Copy one of the examples from `frontend/src/pages/quests/templates` or run `npm run generate-quest --template basic` (use `branching` for multiple paths) to scaffold a template.
2. **Bundle related items and processes** using `scripts/create-content-bundle.js`. This script collects quests, items, and processes into a single JSON file under `submissions/bundles`.
3. **Validate** the quest structure by running:
    ```bash
    npm test -- questValidation
    ```
    Ensure your quest file passes all schema checks. See the [Quest Schema Requirements](/docs/quest-schema) for field definitions.
4. **Check quest quality** with:
    ```bash
    npm test -- questQuality
    ```
    Fix any reported errors until the test passes.
5. **Simulate your quest** to ensure it can be completed:
    ```bash
    npm test -- questSimulation
    ```
    This validates that at least one path leads to a `finish` option.
6. **Open the Quest Submission form** at `/quests/submit`.
7. **Authorize GitHub** by entering a personal access token with `repo` scope. The token is only used client-side to push your quest.
8. **Create the pull request** directly from the form. This uploads your quest to a new branch and opens a draft PR.
9. **Respond to feedback** from reviewers until your quest meets project standards.

Maintainers can review submitted quests at `/quests/review`, approving or rejecting them before merge.

Once merged, your quest will be included in the next game update!

### GitHub Token Setup

1. Visit [github.com/settings/tokens](https://github.com/settings/tokens) and generate a new **classic** token with `repo` scope.
2. Copy the token and keep it somewhere safe. You can revoke it at any time.
3. When using the submission form, paste the token into the "GitHub Token" field. The token is used solely in your browser to create the pull request.
4. The token is saved to your browser's localStorage for convenience. Use the **Clear Token** button when you're finished or revoke it on GitHub.
