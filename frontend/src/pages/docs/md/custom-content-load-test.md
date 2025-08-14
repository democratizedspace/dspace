---
title: 'Custom Content Load Test'
slug: 'custom-content-load-test'
---

Stress test the custom content system by inserting multiple records in parallel.
Run the load test with:

```bash
npm run custom-content:load-test
```

You can adjust the number of records using `--count`:

```bash
npm run custom-content:load-test -- --count 200
```

The script prints JSON metrics similar to:

```json
{
    "insertMs": 35.2,
    "readMs": 8.1,
    "itemCount": 100,
    "processCount": 100,
    "questCount": 100
}
```

Use this to evaluate performance impacts of custom content changes.
