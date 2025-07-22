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
2. **Validate** the quest structure by running:
    ```bash
    npm test -- questValidation
    ```
    Ensure your quest file passes all schema checks.
3. **Check quest quality** with:
    ```bash
    npm test -- questQuality
    ```
    Review any warnings and make improvements where necessary.
4. **Commit your quest** and open a pull request describing the content and inspiration.
5. **Respond to feedback** from reviewers until your quest meets project standards.

Once merged, your quest will be included in the next game update!
