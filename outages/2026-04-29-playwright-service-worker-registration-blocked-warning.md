# Playwright service worker registration blocked warning noise in grouped E2E

## Symptom
Grouped Playwright runs (`npm --prefix frontend run test:e2e:groups`) emitted repeated warning lines:

- `[console.warning] Service Worker registration blocked by Playwright`

The warning appeared in multiple passing suites because each browser context attempted service worker registration.

## Impact
The warning was expected in Playwright's default `serviceWorkers: 'block'` mode, but it created recurring warning noise that obscured actionable console issues during QA review.

## Root cause
The app's offline worker bootstrap (`offlineWorkerRegistration.js`) always attempted `navigator.serviceWorker.register(...)` when service workers existed on `navigator`. In Playwright automation, registration is intentionally blocked; the resulting rejected promise carried the known Playwright message and was logged through the generic registration warning path.

## Fix
- Added a narrow, message-specific guard in offline worker registration error handling.
- When `navigator.webdriver === true` and the rejection message is exactly the known Playwright block warning, the script now logs a low-noise informational message and exits.
- All other registration failures still flow through the existing warning path.

## Verification
- `npm run lint`
- `npm run type-check`
- `npm run build`
- `npm test`
- `node scripts/link-check.mjs`
- `npm --prefix frontend run test:e2e:groups`
- Grouped E2E logs no longer print the Playwright-specific service worker blocked warning while other warnings remain visible.
