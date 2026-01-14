---
title: 'Custom Content Bundles'
slug: 'custom-bundles'
---

# Custom Content Bundles

To keep quests, items, and processes in sync, submissions should include all related content in a single **bundle** file. Bundles live under `submissions/bundles` and use a simple JSON format:

```json
{
    "quests": [],
    "items": [],
    "processes": []
}
```

Each array contains standard objects that follow the existing schemas for quests, items, and processes.

## In-Game Bundle Submission

The easiest way to submit a bundle is through the in-game interface:

1. Create your custom content using the in-game editors:
    - Items: [/items/create](/items/create)
    - Processes: [/processes/create](/processes/create)
    - Quests: [/quests/create](/quests/create)
2. Export your custom content from the management pages
3. Combine them into a bundle JSON following the format above
4. Submit the bundle at [/bundles/submit](/bundles/submit)
5. The system will create a pull request for review

### Custom image uploads

When you upload images for custom items or quests, the editor automatically downscales the
image into a 512×512 JPEG (targeting <50KB). This keeps IndexedDB storage lean for faster
loads and smaller backup exports. Developers should reuse the shared helper at
`frontend/src/utils/images/downsample.js` for any future custom-image ingestion points.

## Command-Line Bundle Creation

You can also create a bundle with the script:

```bash
node scripts/create-content-bundle.js submissions/bundles/my-bundle.json path/to/quest.json --items path/to/item.json --processes path/to/process.json
```

The script resolves glob patterns so multiple files can be included at once. Commit the generated file in your pull request. Reviewers can load the bundle locally to verify your custom content.

An example quest JSON used in our automated tests lives at `frontend/test-data/constellations-quest.json`. You can reference this file when experimenting with the bundle script.

## Testing custom content locally

Use the seeding script to populate IndexedDB with sample data:

```bash
npm run seed:custom
```

The command adds a demo item, process, and quest using `fake-indexeddb`, giving you a safe environment to experiment with the custom content APIs.
