# Custom item detail metadata missing

## Summary
Custom item detail pages rendered UUIDs and the default logo because the page and its compact list
resolved metadata only from the built-in catalog.

## Impact
- Custom items appeared broken and indistinguishable from built-in items.
- Players could not visually confirm custom item names or images on `/inventory/item/[id]`.

## Root cause
The item detail page and compact list used `items.find(...)` against the static catalog and fell
back to IDs and default images when custom UUIDs were not found. Custom content stored in
IndexedDB was ignored in the item metadata pipeline.

## Resolution
- Introduced a unified item resolver that merges built-in catalog data with custom content from
  IndexedDB, including custom images and blob handling.
- Updated the item detail page and compact list to await resolved metadata and show loading
  placeholders instead of incorrect fallbacks.
- Added unit, component, and E2E coverage to prevent regressions.

## Verification
- Visit `/inventory/item/<custom-uuid>` after creating a custom item and confirm the heading and
  hero image match the custom item, and the compact list icon matches the hero image.
- Visit `/inventory/item/<built-in-id>` and confirm built-in items still render their catalog
  names and images.
- Tests:
  - `npm run lint`
  - `npm run test:ci`
  - `npm run test:e2e`
