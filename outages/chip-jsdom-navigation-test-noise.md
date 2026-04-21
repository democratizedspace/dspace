# Chip jsdom navigation test noise

## Symptom
Chip link test emitted `Not implemented: navigation (except hash changes)`.

## Root cause
Active anchor click triggered jsdom default navigation during assertion.

## Fix
Updated the active-link click handler in test to `preventDefault()` while still asserting callback invocation.

## Verification
`npm test` runs chip tests without jsdom navigation stderr.
