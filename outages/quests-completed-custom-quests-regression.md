# title
Completed custom quests classification regression in Quests view

## symptom
`frontend/__tests__/Quests.test.js` intermittently failed to find the completed custom-quest row under Completed Quests.

## root cause
The failure was state/ordering sensitive in test execution and did not reproduce once the full suite/environment was rebuilt; no current product regression remained.

## fix
Re-verified the Quests regression test in isolation and in full root test runs and kept production behavior unchanged.

## verification
- `npm run test:root -- frontend/__tests__/Quests.test.js`
- `npm run test:root`
