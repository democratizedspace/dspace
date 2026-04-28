# Playwright Chromium headless-shell install warning

## Warning
Grouped Playwright E2E runs repeatedly emitted:
`Playwright chromium executable found ... but headless shell is missing. Proceeding with chromium binary only.`

## Impact
QA output was noisy across many groups, making it harder to spot real failures and hiding whether browser setup had actually completed.

## Root cause
The Playwright browser check treated "Chromium exists" as success even when `chromium-headless-shell` was missing, so the install path did not run. Grouped runs then re-discovered the missing headless shell during each Playwright invocation.

## Fix
- Made Playwright browser verification require both Chromium and `chromium-headless-shell`.
- Updated setup logic to install missing browser assets when Chromium exists but headless shell does not.
- Ensured grouped E2E runs call browser verification once up front before launching all test groups.

## Verification
- `npm --prefix frontend run playwright:install`
- `npm --prefix frontend run test:e2e:groups`
- `npm run lint`
- `npm run type-check`
- `npm run build`
- `npm test`
- `node scripts/link-check.mjs`
