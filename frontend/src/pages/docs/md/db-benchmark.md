---
title: 'Database Benchmark'
slug: 'db-benchmark'
---

DSPACE includes a Node-based utility to measure custom content IndexedDB performance. It uses
`fake-indexeddb` so you can run it without a browser.

Run the benchmark with:

```bash
npm run db:benchmark
```

Pass `--count <n>` to adjust the number of records per entity (defaults to 50):

```bash
npm run db:benchmark -- --count 100
```

The script inserts and reads sample records, printing JSON metrics like:

```json
{
    "insertMs": 12.5,
    "readMs": 4.2,
    "itemCount": 50,
    "processCount": 50,
    "questCount": 50
}
```

Use this to track database performance during development.
