# title
Prettier formatting regression in root utility/tests

## symptom
`scripts/tests/prettierFormatting.test.ts` reported formatting drift.

## root cause
Formatting drift had existed in files called out by the gate logs.

## fix
Ensured formatting checks pass in the current tree after targeted cleanups and follow-on edits.

## verification
- `npm run format:check`
- `npm run test:root -- scripts/tests/prettierFormatting.test.ts`
