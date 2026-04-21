# Chip jsdom navigation noise

## title
Chip jsdom navigation noise

## symptom
Chip test triggered jsdom `Not implemented: navigation` stderr noise.

## root cause
Test clicked a real path link (`/docs`) in jsdom, which tries unsupported navigation.

## fix
Changed test link href to hash navigation (`#docs`) while still asserting click-handler behavior.

## verification
`npm run test:root -- frontend/src/components/__tests__/Chip.spec.ts`
