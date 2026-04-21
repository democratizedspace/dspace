# dUSD fallback warning test noise

## Symptom
Tests emitted `dUSD item not found ... falling back` warnings.

## Root cause
Mock item catalogs omitted canonical dUSD entry, exercising fallback warning path unintentionally.

## Fix
Included canonical dUSD item in test mocks used by inventory/process form tests.

## Verification
`npm test` no longer emits dUSD fallback warnings for those suites.
