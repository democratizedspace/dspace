# title
Playwright deps sentinel warning noise in unit tests

## symptom
`ensurePlaywrightBrowsers.test.ts` printed sentinel creation warnings in mocked negative paths.

## root cause
The suite exercises sentinel write edge-cases and proxy sanitization paths that log warnings.

## fix
Added a test-local `console.warn` spy for the suite; existing assertions still validate warning behavior where needed.

## verification
- `npm run test:root -- scripts/tests/ensurePlaywrightBrowsers.test.ts`
