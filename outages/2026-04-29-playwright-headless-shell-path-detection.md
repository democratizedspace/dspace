# Playwright headless shell false-missing warnings during grouped E2E

## Symptom
During grouped Playwright runs (`npm run test:e2e:groups`), each group printed:

- `Playwright chromium headless shell is still missing after installation. Tests may fail if browsers are unavailable.`

The warning appeared even though Chromium launched and all E2E specs passed.

## Root cause
`resolveHeadlessShellPath` assumed headless shell binaries always mirrored Chromium's executable
subpath (including `Chromium.app/...` on macOS). On current Playwright macOS layouts, the
headless shell may be installed at `chrome-mac/headless_shell` instead, so detection returned a
false negative.

## Fix
- Expanded headless shell path detection to probe macOS-specific alternate layouts:
  - `chrome-mac/headless_shell`
  - `chrome-mac/HeadlessShell.app/Contents/MacOS/headless_shell`
- Kept the existing warning behavior unchanged for true missing-browser states.
- Added regression coverage for the `chrome-mac/headless_shell` layout.

## Verification commands
- `npm run test -- scripts/tests/ensurePlaywrightBrowsers.test.ts`
- `npm run test:e2e:groups`
- `npm test`

## Why tests passed despite the warning
Playwright tests were launching with a valid Chromium executable. The warning was emitted by the
helper's path detector only, not by a launcher failure. That made it noisy but non-blocking.
