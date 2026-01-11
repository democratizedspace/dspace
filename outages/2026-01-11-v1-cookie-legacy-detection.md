# V1 cookie legacy save detection missing in settings

## Summary
The v3 legacy upgrade UI failed to detect v1 cookie saves inside the Settings page, even when
cookies were present. The global legacy banner still appeared, but the Settings V1 card showed
“No v1 cookies found” and prevented merge/replace actions.

## Impact
- QA could not validate v1 → v3 merges using the Settings UI.
- Users with v1 cookie saves were blocked from importing inventory into v3 through the
  primary upgrade surface.

## Root cause
The Settings UI relied on server-side `Astro.cookies` parsing (`frontend/src/pages/settings.astro`
→ `frontend/src/utils/migrationCookies.js`) for v1 inventory, while the global banner used
client-side `document.cookie` detection. In v3, the Settings component never re-read cookies
on the client, so seeded or existing v1 cookies were invisible to the V1 card even though the
banner correctly detected them.

## Contributing factors
- Two independent detection paths (server cookies vs. client cookies) drifted without a shared
  helper, causing inconsistent detection results.
- The Settings V1 card had no explicit warning when cookies existed but parsing failed or was
  skipped, making the failure appear as “no cookies.”

## Fix
- Introduced a shared `detectV1CookieItems` helper in `frontend/src/utils/legacySaveDetection.ts`.
- Updated the global banner and Settings V1 card to use the same helper and re-run detection on
  `legacy-upgrade-refresh`.
- Surfaced parsing warnings in the V1 card when legacy cookie keys exist but values are invalid.

## Prevention
- Keep v1 detection centralized in a shared helper that can be exercised by unit tests.
- Add integration coverage for the Settings V1 merge path to ensure inventory import + trophy
  award works end-to-end.

## Verification steps
1. Open `/settings` in staging, enable QA cheats, and click **Seed sample v1 save (cookies)**.
2. Confirm the V1 card reports detected cookies and enables **Merge v1 into current save**.
3. Merge and verify v1 items plus the **Early Adopter Token** appear in inventory.
4. Clear v1 cookies and confirm the global banner and V1 card both clear.

## References
- PR: (pending)
- `frontend/src/utils/legacySaveDetection.ts`
- `frontend/src/components/svelte/LegacySaveUpgrade.svelte`
- `frontend/src/components/svelte/LegacyUpgradeBanner.svelte`
- `frontend/__tests__/legacySaveUpgrade.integration.test.js`
