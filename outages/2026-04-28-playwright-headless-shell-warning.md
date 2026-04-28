# Playwright grouped E2E repeated headless-shell warning

## Symptom

Grouped E2E runs repeatedly logged:
`Playwright chromium executable found ... but headless shell is missing. Proceeding with chromium binary only.`

## Impact

QA output was noisy across multiple test groups, and local/CI setup could continue with a partial Playwright browser bundle instead of installing the required headless shell once up front.

## Root cause

`ensurePlaywrightBrowsers()` used `hasChromiumExecutable()` as a single readiness check. That helper returned success when Chromium existed even if `chromium-headless-shell` was missing, so the install step exited early and emitted warnings on every Playwright invocation.

## Fix

Updated browser readiness logic to treat Chromium + headless shell as one required bundle for grouped E2E setup. The installer now runs when the headless shell is missing, and warning text was narrowed to post-install/skip-download incomplete states.

## Verification

- `npm run lint`
- `npm run type-check`
- `npm run build`
- `npm test`
- `node scripts/link-check.mjs`
- `npm --prefix frontend run playwright:install`
- `npm --prefix frontend run test:e2e:groups`
