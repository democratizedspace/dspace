# Playwright service worker registration warning noise

## Impact
Grouped Playwright runs were green, but emitted repeated warning lines:

- `[console.warning] Service Worker registration blocked by Playwright`

This created QA noise and obscured unexpected warnings.

## Root cause
The app always attempts offline service worker registration in browser contexts where it is enabled.
During many E2E projects, Playwright is configured with `serviceWorkers: 'block'`, so registration is intentionally denied.
The rejection bubbled into generic warning logging (`Service worker registration failed:`), producing expected-but-noisy console warnings.

## Fix
A targeted guard now detects this exact expected Playwright rejection message and suppresses that one case only.
All other registration failures continue to log warnings.

## Verification
- Unit test coverage added for the suppressed Playwright block path.
- Existing registration failure warning tests remain in place to ensure non-Playwright failures still warn.
