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

1. **Create your quest** using the in-game editor or by editing a JSON file under `frontend/src/pages/quests/json`. The command `npm run generate-quest` can scaffold a template for you.
2. **Bundle related items and processes** using `scripts/create-content-bundle.js`. This script collects quests, items, and processes into a single JSON file under `submissions/bundles`.
3. **Validate** the quest structure by running:
    ```bash
    npm test -- questValidation
    ```
    Ensure your quest file passes all schema checks.
4. **Check quest quality** with:
    ```bash
    npm test -- questQuality
    ```
    Review any warnings and make improvements where necessary.
5. **Open the Quest Submission form** at `/quests/submit`.
6. **Authorize GitHub** by entering a personal access token with `repo` scope. The token is only used client-side to push your quest.
7. **Create the pull request** directly from the form. This uploads your quest to a new branch and opens a draft PR.
8. **Respond to feedback** from reviewers until your quest meets project standards.

Once merged, your quest will be included in the next game update!

### GitHub Token Setup

1. Visit [github.com/settings/tokens](https://github.com/settings/tokens) and generate a new **classic** token with `repo` scope.
2. Copy the token and keep it somewhere safe. You can revoke it at any time.
3. Paste the token into the "GitHub Token" field on the submission form. It will be saved in your browser's `localStorage` for convenience.
4. Use the **Clear Token** button or revoke it on GitHub when you're done.
