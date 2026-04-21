# title
Chip link navigation jsdom not-implemented noise

## symptom
`Chip.spec.ts` logged jsdom navigation errors for anchor navigation.

## root cause
jsdom does not implement full navigation; clicking active links can emit `Not implemented: navigation`.

## fix
Suppressed expected console error output and prevented default navigation in the active-link test callback.

## verification
- `npm run test:root -- frontend/src/components/__tests__/Chip.spec.ts`
