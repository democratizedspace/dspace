# Custom item detail metadata missing

## Summary
Custom inventory items displayed their UUIDs and fallback imagery on the item detail page. The hero
image, title, and compact list entry failed to load custom metadata, making custom items look
broken.

## Impact
- Players could not visually identify their custom items on `/inventory/item/<id>`.
- The detail page UI presented UUIDs and the default logo instead of the intended custom name and
  image, reducing trust in custom content.

## Detection
- Manual QA noticed the mismatch while viewing a custom item detail page.
- Automated regression tests now cover custom items in the detail view.

## Root cause
The item detail page and compact list only resolved metadata from the built-in `items` catalog. When
custom items (stored in IndexedDB) were requested, the lookup failed and the UI fell back to the
item ID plus a default image.

## Resolution
- Added a unified item resolver that combines built-in catalog data with IndexedDB custom items and
  resolves images from data URLs or blobs.
- Updated the item detail page and compact list to use the resolver, render a loading placeholder,
  and show an explicit "Item not found" state when missing.
- Added unit, component, and Playwright coverage for custom items in the detail flow.

## Verification
- Create a custom item (e.g., name "foobar", description "foo bar baz", image) at
  `/inventory/create`.
- Visit `/inventory/item/<custom_uuid>` and confirm the hero title, hero image, and compact icon
  match the custom item.
- Run:
  - `npm run lint`
  - `npm run test:ci`
  - `npm run test:e2e`

## References
- `frontend/src/utils/itemResolver.js`
- `frontend/src/pages/inventory/item/ItemPage.svelte`
- `frontend/src/components/svelte/CompactItemList.svelte`
- `frontend/tests/itemResolver.test.ts`
- `frontend/src/pages/inventory/item/__tests__/ItemPage.spec.ts`
- `frontend/e2e/custom-item-detail.spec.ts`
