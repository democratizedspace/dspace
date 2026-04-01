# V1 cookie saves missing in legacy upgrade UI

## Summary
The legacy upgrade UI failed to surface v1 cookie saves after QA seeding in v3. The global banner
would react to cookies, but the Settings card continued to report “No v1 cookies found,” preventing
merge/replace actions.

## Impact
- QA could not validate the v1 merge flow in staging.
- Players with v1 cookie saves were blocked from the upgrade action if they relied on the Settings
  screen.

## Detection
- QA reproduced the issue by seeding v1 cookies via the Settings QA tools, then observing the v1
  card remain empty.
- Browser DevTools confirmed the `item-<id>` cookies were present.

## Root cause
`LegacySaveUpgrade.svelte` only rendered v1 items from the server-provided cookie list (Astro
cookies). The client-side detection ran, but it only updated a boolean flag and never refreshed the
items list, so the UI stayed empty after client-set cookies were added.

## Contributing factors
- The detection helper and UI state were split, allowing the banner and the Settings card to drift.
- Refresh events (`legacy-upgrade-refresh`) re-ran detection but did not update v1 item details.

## Resolution
- Introduced a shared v1 cookie parser and routed both the banner and Settings card through it.
- Hydrated v1 items from `document.cookie` on refresh, and surfaced parse issues in the UI so
  malformed cookies no longer fail silently.

## Prevention
- Added a Svelte component test that seeds v1 cookies, runs the merge action, and asserts v3
  inventory + Early Adopter Token output.
- Added unit coverage for the v1 cookie parser to keep URL-encoded and malformed values from
  regressing detection.

## Verification
- Seed v1 cookies via **Settings → QA Cheats → Seed sample v1 save (cookies)**.
- Confirm the v1 card shows detected cookies and the merge action is enabled.
- Run **Merge v1 into current save** and verify the inventory now includes the v1 items plus the
  **Early Adopter Token** trophy.

## References
- `frontend/src/components/svelte/LegacySaveUpgrade.svelte`
- `frontend/src/utils/legacySaveDetection.ts`
- `frontend/src/components/__tests__/LegacySaveUpgrade.spec.ts`
- `frontend/__tests__/legacySaveDetection.test.ts`
- `docs/qa/v3.md`
