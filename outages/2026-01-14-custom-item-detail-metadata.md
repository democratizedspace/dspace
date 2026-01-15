# Custom item detail metadata missing in inventory item page

## Summary

Custom inventory items showed their UUIDs and fallback images on the
`/inventory/item/{id}` page instead of the custom name and image.

## Impact

- Custom item detail pages looked broken or untrustworthy.
- Players could not visually distinguish custom items from fallback placeholders.

## Root cause

The item detail page and compact list row resolved metadata only from the built-in items
catalog, ignoring custom items stored in IndexedDB.

## Resolution

- Added a unified item resolver that merges built-in and custom item metadata, including
  image resolution for data URLs and blobs.
- Updated the item detail page and compact item list to use the resolver and show loading
  placeholders until metadata is available.
- Added unit, component, and E2E regression coverage for custom item metadata and image
  rendering.

## Verification

- Visit `/inventory/item/{custom-uuid}` after creating a custom item with image metadata and
  confirm the hero image and list icon match the custom image.
- Confirm built-in items still render their names and images.
- Run:
  - `npm run lint`
  - `npm run test:ci`
  - `npm run test:e2e`

## References

- `frontend/src/utils/itemResolver.js`
- `frontend/src/pages/inventory/item/ItemPage.svelte`
- `frontend/src/components/svelte/CompactItemList.svelte`
- `frontend/src/components/svelte/compactItemListHelpers.js`
- `frontend/tests/itemResolver.test.ts`
- `frontend/src/pages/inventory/item/__tests__/ItemPage.spec.ts`
- `frontend/e2e/custom-item-detail.spec.ts`
