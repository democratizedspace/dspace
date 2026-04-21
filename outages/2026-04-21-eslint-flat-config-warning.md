# ESLint flat-config warning

## title
ESLint flat-config warning

## symptom
Lint emitted `ESLintRCWarning` due to forcing legacy config mode.

## root cause
`frontend/package.json` lint scripts set `ESLINT_USE_FLAT_CONFIG=false` even though flat config exists.

## fix
Updated frontend lint scripts to run eslint directly without forcing eslintrc mode.

## verification
`npm run lint`
