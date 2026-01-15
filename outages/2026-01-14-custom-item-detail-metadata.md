# Custom item detail metadata missing on item pages

## Summary
Custom inventory items rendered with UUIDs and fallback imagery on `/inventory/item/[id]` because the
item detail UI only resolved metadata from the built-in catalog instead of the custom content
store.

## Impact
- Custom items appeared broken and indistinguishable from built-in items.
- Players saw UUIDs and default icons instead of their custom item name and image, reducing
  trust in the inventory system.

## Root cause
The item detail page and compact list renderer only looked up item metadata in the static
`items` catalog. Custom items stored in IndexedDB were not part of that catalog, so the UI fell
back to showing the raw id and a default image.

## Resolution
- Added a unified item resolver that merges built-in items with custom items stored in
  IndexedDB.
- Updated the item detail page and compact list renderer to use the resolver and show a loading
  placeholder until metadata is available.
- Added regression tests (unit, component, and E2E) that cover custom item rendering.

## Verification
- Visit `/inventory/item/<custom-uuid>` after creating a custom item (for example, via
  `/inventory/create`) and confirm the hero title, hero image, and compact list icon show the
  custom name/image.
- Visit `/inventory/item/83fe7eee-135e-4885-9ce0-9042b9fb860a` and confirm the built-in aquarium
  item still renders correctly.
- Run:
  - `npm run lint`
  - `npm run test:ci`

## References
- `frontend/src/utils/itemResolver.js`
- `frontend/src/pages/inventory/item/ItemPage.svelte`
- `frontend/src/components/svelte/CompactItemList.svelte`
- `frontend/src/components/svelte/compactItemListHelpers.js`
- `frontend/__tests__/itemResolver.test.js`
- `frontend/__tests__/ItemPage.test.js`
- `frontend/e2e/custom-item-detail.spec.ts`
