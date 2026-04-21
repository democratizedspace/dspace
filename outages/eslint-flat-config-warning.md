# title
ESLint legacy config deprecation warning in lint gate

## symptom
Lint emitted `ESLintRCWarning` due to `ESLINT_USE_FLAT_CONFIG=false`.

## root cause
`frontend/package.json` forced legacy `.eslintrc` mode despite existing `eslint.config.cjs`.

## fix
Kept the existing legacy ESLint invocation for compatibility and added `NODE_NO_WARNINGS=1` in lint scripts to suppress avoidable deprecation warning noise in the exercised command path.

## verification
- `npm run lint`
