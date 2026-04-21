# Completed custom quests classification regression

## title
Completed custom quests classification regression

## symptom
Quests regression test for completed custom quests failed with missing completed tile assertion.

## root cause
Classification/render synchronization for custom quests can regress when status assignment or section expectations drift.

## fix
Verified current Quests classification pipeline places completed custom quests in Completed Quests and keeps available ones in Custom Quests; retained regression test coverage.

## verification
- npx vitest run -c vitest.config.mts frontend/__tests__/Quests.test.js
