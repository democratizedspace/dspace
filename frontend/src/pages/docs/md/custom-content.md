---
title: 'Custom Content'
slug: 'custom-content'
---

# Custom Content

Custom content is the player-created layer of DSPACE. You can build your own quests, items, and
processes directly in the game, test them locally, back them up, and package them for contribution.

<figure>
    <img src="/assets/changelog/20260401/ccsbs.jpg" alt="A screenshot showing the forms for creating custom quests, items, and processes, side by side." />
    <figcaption align="center">Custom Content creation side by side</figcaption>
</figure>

## What custom content includes

DSPACE supports three editable content types that work as one system:

1. **Quests**: branching dialogue, requirements, rewards, and process-linked actions
2. **Items**: resources, tools, currencies, and custom dependencies used by quests and processes
3. **Processes**: timed transformations that require, consume, and create items

Create routes:

- Quests: `/quests/create`
- Items: `/inventory/create`
- Processes: `/processes/create`

## How the systems interact

Think of content authoring as a loop:

1. Define items that represent resources, tools, or rewards.
2. Build processes that consume and create those items over time.
3. Author quests that require items, grant items, and trigger relevant processes.
4. Playtest and adjust balancing across all three.

Common interaction examples:

- A quest option checks for required items before progression.
- A quest option launches a process and then gates continuation on the outputs.
- A process consumes one custom item and creates another, unlocking later quest branches.
- A quest completion reward grants a custom item that can be used in future processes.

## Local-first storage and backup

Custom content is local-first and stored on-device in IndexedDB (`CustomContent` database). This lets
you iterate quickly without needing server-side authoring infrastructure.

- If IndexedDB is unavailable, the app uses an in-memory fallback (non-persistent).
- Custom content backup and restore is available at `/contentbackup`.
- Gameplay save backup remains separate under `/gamesaves`.

Recommended workflow:

1. Author or edit content locally.
2. Export from `/contentbackup`.
3. Re-import into a clean profile to verify integrity before sharing.

<figure>
    <img src="/assets/changelog/20260401/customcontent.jpg" alt="A screenshot of the Custom Content Backup page in DSPACE." />
    <figcaption align="center">Custom Content Backup</figcaption>
</figure>

## Packaging and submitting a content pack

The current contribution flow supports packaging your custom content into a bundle JSON and submitting
it through an in-game PR form.

1. Build quests/items/processes locally.
2. Export from `/contentbackup`.
3. Submit the bundle at `/bundles/submit`.
4. The app creates a PR containing a bundle file under `submissions/bundles/` for maintainer review.

This is the recommended route when your content has cross-dependencies.

In-progress note:

- The bundle submission path is implemented and opens PRs, but full downstream promotion/ingestion
  into canonical built-in content remains a maintainer-governed step and may continue evolving.

<figure>
    <img src="/assets/changelog/20260401/ccbundles.jpg" alt="A screenshot of the Custom Content Bundle submission page in DSPACE." />
    <figcaption align="center">Submit Custom Content Bundle</figcaption>
</figure>

## Practical authoring tips

- Design item IDs and names with reuse in mind so process and quest references stay readable.
- Keep process durations realistic enough to teach pacing, but short enough for playtesting loops.
- Use quest prerequisites and rewards to communicate progression clearly.
- Validate by replaying your quest chain after process outputs are collected.

## Related docs

- [Content Development Guide](/docs/content-development)
- [Custom Content Bundles](/docs/custom-content-bundles)
- [Quest Submission Guide](/docs/quest-submission)
- [Quest Development Guidelines](/docs/quest-guidelines)
- [Item Development Guidelines](/docs/item-guidelines)
- [Process Development Guidelines](/docs/process-guidelines)
- [Backups](/docs/backups)
