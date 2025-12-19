# case-insensitive-price-lookup

- **Date:** 2025-08-12
- **Component:** backend
- **Root cause:** approximateIrlPrice rejected mixed-case or hyphenated item IDs
- **Resolution:** normalized input to lowercase and replaced spaces and hyphens before lookup
- **References:**
  - (none listed)
