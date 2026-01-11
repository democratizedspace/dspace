# V1 cookie legacy saves not detected in Settings

## Summary
The v3 Settings "Legacy save upgrades" panel failed to detect v1 cookie saves, even when
cookies were present in the browser. The global banner detected legacy artifacts, but the
V1 card showed "No v1 cookies found," preventing merge/replace actions.

## Impact
- QA and players with v1 cookie saves could not access the merge/replace flows in Settings.
- The Early Adopter Token trophy was not granted because v1 merges could not run.

## Root cause
The Settings upgrade card relied on server-rendered cookie parsing from
`Astro.cookies` (`frontend/src/pages/settings.astro` → `frontend/src/utils/migrationCookies.js`)
and never re-parsed `document.cookie` on the client. Meanwhile, the global legacy banner
used a separate client-side detector (`frontend/src/utils/legacySaveDetection.ts`).
When cookies were created in the browser (QA seeding), the banner detected them but the
Settings card kept its empty SSR payload.

## Contributing factors
- Two separate detection paths (SSR cookies vs. client `document.cookie`) drifted.
- The Settings UI did not surface parsing failures, leaving users with no recovery guidance.

## Fix
- Introduced a shared `detectV1CookieItems` helper for v1 cookie detection and parsing.
- Updated the Settings upgrade card to refresh cookie detection on the client and to
  surface parse warnings when v1 cookies are malformed.
- Added unit tests for v1 cookie parsing and Playwright coverage for the full Settings merge
  flow, including Early Adopter Token verification.

## Prevention
- Shared helper ensures v1 detection stays consistent across banner and Settings.
- Automated regression coverage for v1 detection + merge behavior.

## Verification steps
1. Open `/settings`, enable QA Cheats, and click **Seed sample v1 save (cookies)**.
2. Confirm the global legacy banner appears on other pages.
3. In Settings, confirm the V1 card shows detected cookies and the merge button is enabled.
4. Click **Merge v1 into current save** and verify inventory + Early Adopter Token in IndexedDB.

## References
- `frontend/src/utils/legacySaveDetection.ts`
- `frontend/src/components/svelte/LegacySaveUpgrade.svelte`
- `frontend/e2e/legacy-v1-upgrade.spec.ts`
- PR: (this change)
