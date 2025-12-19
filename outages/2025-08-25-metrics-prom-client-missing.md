# metrics-prom-client-missing

- **Date:** 2025-08-25
- **Component:** metrics endpoint
- **Root cause:** metrics utility crashed when prom-client dependency was absent
- **Resolution:** load prom-client dynamically with a fallback register
- **References:**
  - frontend/src/utils/metrics.js
  - tests/metricsFallback.test.ts
