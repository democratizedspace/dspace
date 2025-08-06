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

Each array contains standard objects that follow the existing schemas for quests, items, and processes. You can create a bundle with the script:

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
