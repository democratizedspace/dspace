# Prettier formatting gate regression

## title
Prettier formatting gate regression

## symptom
Formatting gate flagged three frontend files as unformatted.

## root cause
Prettier check is enforced in CI and local gate; drift can reappear after manual edits.

## fix
Ran frontend-scoped Prettier write/check flow on the implicated files to ensure canonical formatting.

## verification
- npm run format:check
