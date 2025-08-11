---
title: 'Database Benchmarks'
slug: 'db-benchmark'
---

# Database Benchmarks

DSPACE includes a simple benchmark for the custom content database. It inserts and reads sample
records using IndexedDB to help track performance over time.

Run the benchmark from the `frontend` directory:

```bash
npm run benchmark:db
```

The command outputs JSON with timing metrics and record counts:

```json
{
    "insertMs": 12.3,
    "readMs": 5.6,
    "itemCount": 50,
    "processCount": 50,
    "questCount": 50
}
```

Use these numbers to watch for regressions when changing database code.
