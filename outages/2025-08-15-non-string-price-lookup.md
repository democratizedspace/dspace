# non-string-price-lookup

- **Date:** 2025-08-15
- **Component:** backend
- **Root cause:** approximateIrlPrice threw when provided non-string input
- **Resolution:** return null for null, undefined, or non-string inputs
- **References:**
  - backend/approximateIrlPrice.ts
  - backend/approximateIrlPrice.test.ts
