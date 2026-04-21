# ESLint flat-config deprecation warning

## title
ESLint flat-config deprecation warning

## symptom
Lint emitted ESLintRCWarning due to forcing legacy eslintrc mode.

## root cause
frontend lint scripts explicitly set ESLINT_USE_FLAT_CONFIG=false despite having eslint.config.cjs.

## fix
Removed the legacy env override from frontend lint scripts so ESLint runs with flat config defaults.

## verification
- npm run lint
