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
4. **Export a bundle** from [/contentbackup](/contentbackup) (Prepare backup → Download backup)
5. **Submit the bundle** at `/bundles/submit` with your GitHub token (paste the JSON from the
   downloaded backup or from `scripts/create-content-bundle.js`)
6. **Respond to feedback** on the generated pull request

### Option 2: Quest-Only Submission

If your quest uses only existing items and processes:

1. **Create your quest** using the in-game editor at `/quests/create`
    - Add quest completion rewards with the item picker for any items you want to grant on finish
    - Use the process picker for “Run process” dialogue options when applicable
2. **Export the quest JSON** from your custom content backup or copy the JSON file if you're
   authoring it in the repository.
3. **Validate** the quest structure by running:
    ```bash
    node scripts/validate-quest.js path/to/quest.json
    ```
4. **Submit at** `/quests/submit` with your GitHub token (paste the quest JSON into the form)
5. **Respond to feedback** on the generated pull request

## Quest Images

When you upload a custom quest image in-game, the client downsamples it to a 512×512 JPEG and
compresses it to target **< 50KB**. This keeps IndexedDB storage lean for faster exports and
load times. Developers should use the shared helper at
`frontend/src/utils/imageDownsample.js` for future custom image ingestion.

## Manual Submission (Advanced)

For manual submissions via command-line:

1. **Bundle related content** using `scripts/create-content-bundle.js`, for example:
   ```bash
   node scripts/create-content-bundle.js submissions/bundles/my-bundle.json path/to/quest.json --items path/to/item.json --processes path/to/process.json
   ```
   This script collects quests, items, and processes into a single JSON file under `submissions/bundles`.
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
