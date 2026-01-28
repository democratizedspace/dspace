---
title: 'Quest Submission Guide'
slug: 'quest-submission'
---

# Quest Submission Guide

This guide describes how to submit your custom quests to become part of the official DSPACE release.

## Prerequisites

- Familiarity with the [Quest Development Guidelines](/docs/quest-guidelines)
- A local copy of this repository with all dependencies installed
- Optional: start from the [Quest Template Example](/docs/quest-template) for a minimal JSON
  structure

## Submission Options

You have two ways to submit your quest:

### Option 1: Bundle Submission (Recommended)

If your quest requires custom items or processes, use the bundle submission workflow:

1. **Create your quest** using the in-game editor at `/quests/create`
    - Configure quest completion rewards with the item picker (including bundled custom items)
    - Use the process picker for “Run process” dialogue options and set item counts as needed
2. **Create related items** at `/inventory/create` if needed
3. **Create related processes** at `/processes/create` if needed
4. **Export your custom content** from `/contentbackup` (Prepare backup → Download backup)
5. **Package everything into a bundle** following the [Custom Content Bundles](/docs/custom-bundles)
   format
6. **Submit the bundle** at `/bundles/submit` with your GitHub token
7. **Respond to feedback** on the generated pull request

### Option 2: Quest-Only Submission

If your quest uses only existing items and processes:

1. **Create your quest** using the in-game editor at `/quests/create`
    - Add quest completion rewards with the item picker for any items you want to grant on finish
    - Use the process picker for “Run process” dialogue options when applicable
2. **Export your quest JSON** from `/contentbackup` (Prepare backup → Download backup), or work from
   a local quest JSON file if you created it manually.
3. **Validate** the quest structure by running:
    ```bash
    cd frontend
    npm test -- questValidation questCanonical questDependencies questSimulation
    ```
4. **Check quest quality** with:
    ```bash
    cd frontend
    npm test -- questQuality
    ```
5. **Submit at** `/quests/submit` with your GitHub token
6. **Respond to feedback** on the generated pull request

## Quest Images

When you upload a custom quest image in-game, the client downsamples it to a 512×512 JPEG and
compresses it to target **< 50KB**. This keeps IndexedDB storage lean for faster exports and
load times. Developers should use the shared helper at
`frontend/src/utils/imageDownsample.js` for future custom image ingestion.

## Manual Submission (Advanced)

For manual submissions via command-line:

1. **Bundle related content** using `scripts/create-content-bundle.js`. This script collects quests, items, and processes into a single JSON file under `submissions/bundles`.
2. **Validate** all content following the guidelines above
3. **Create a pull request** manually with your bundle file
4. **Regenerate the new quests list** by running `npm run new-quests:update` and
   committing the updated `/docs/new-quests.md` to keep quest counts accurate.

Maintainers can review submitted quests at `/quests/review`, approving or rejecting them before
merge.

If something goes wrong, the submission form will display an error message so you can adjust and try again.

Once merged, your quest will be included in the next game update!

For the full workflow, see the [Quest Contribution Guidelines](/docs/quest-contribution).

### GitHub Token Setup

1. Visit [github.com/settings/tokens](https://github.com/settings/tokens) and generate a new **classic** token with `repo` scope.
2. Copy the token and keep it somewhere safe. You can revoke it at any time.
3. When using the submission form, paste the token into the "GitHub Token" field. The token is used solely in your browser to create the pull request.
4. The token is saved in IndexedDB under `gameState.github.token` for
   convenience. Use the **Clear Token** button when you're finished or revoke it
   on GitHub. See the [Authentication Flow](/docs/authentication) for more
   details.
