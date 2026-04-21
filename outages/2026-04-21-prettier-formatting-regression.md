# Prettier formatting regression

## title
Prettier formatting regression

## symptom
`scripts/tests/prettierFormatting.test.ts` failed `npm run format:check`.

## root cause
Frontend formatting can drift when root and frontend configs are mixed or stale local edits exist.

## fix
Ran frontend Prettier against the three flagged files to ensure formatter compliance.

## verification
`npm run test:root -- scripts/tests/prettierFormatting.test.ts` and `npm run format:check`
