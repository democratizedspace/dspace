# V1 cookie saves not detected in settings

## Summary
The v3 legacy upgrade UI failed to surface v1 cookie saves on `/settings`, so the V1 card reported
“No v1 cookies found” even when legacy cookies were present.

## Impact
- QA could seed v1 cookies, see them in browser storage, yet the settings UI provided no merge or
  replace actions.
- The Early Adopter Token trophy and v1 inventory merge flow were blocked in staging.

## Root cause
The `/settings` upgrade card relied on SSR-only cookie parsing (`legacyV1Items` from
`Astro.cookies`) and never refreshed the parsed item list from `document.cookie` on the client.
When the server-side parse returned an empty list, the UI stayed in the “no cookies” state even
though the client-side detector (used by the global banner) could see legacy cookies.

## Contributing factors
- Cookie parsing and detection were implemented in separate helpers, so the settings UI and
  banner used different logic.
- Parsing failures were silent; malformed values did not produce a warning in the V1 card.

## Fix
- Added a shared `detectV1CookieItems()` helper and wired both the banner and settings card to use
  it via `detectLegacyArtifacts()`.
- Surfaced parsing failures in the V1 card with a recovery message.
- Added regression coverage for parsing and settings merge behavior.

## Prevention
- Unit coverage for v1 cookie parsing edge cases.
- Playwright regression test that seeds cookies, merges, and asserts inventory + trophy results.

## Verification
1. Enable QA cheats on `/settings`.
2. Click **Seed sample v1 save (cookies)**.
3. Confirm the V1 card shows detected cookies and **Merge v1 into current save** is enabled.
4. Merge and confirm inventory includes v1 items plus the Early Adopter Token.

## References
- PR: TBD
- `frontend/src/utils/legacySaveDetection.ts`
- `frontend/src/components/svelte/LegacySaveUpgrade.svelte`
- `frontend/src/utils/migrationCookies.js`
- `frontend/__tests__/legacySaveDetection.test.ts`
- `frontend/e2e/legacy-import.spec.ts`
