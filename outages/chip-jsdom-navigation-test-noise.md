# Chip jsdom navigation warning noise

## title
Chip jsdom navigation warning noise

## symptom
Chip link-click test triggered jsdom Not implemented: navigation warning.

## root cause
Active-link test clicked a real path href causing jsdom navigation side effect.

## fix
Changed active-link test href to hash-based route to keep click behavior assertion without triggering navigation implementation warnings.

## verification
- npx vitest run -c vitest.config.mts frontend/src/components/__tests__/Chip.spec.ts
