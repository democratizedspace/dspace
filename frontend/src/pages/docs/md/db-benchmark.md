---
title: 'Database Benchmark'
slug: 'db-benchmark'
---

DSPACE includes a utility to measure IndexedDB performance for custom content.
Run the benchmark with:

```bash
npm run db:benchmark
```

Use the `--count <n>` option to customize how many records are inserted:

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
