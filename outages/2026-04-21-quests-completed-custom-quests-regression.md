# Quests completed custom quests regression

## title
Quests completed custom quests regression

## symptom
`frontend/__tests__/Quests.test.js` intermittently failed to find the completed custom quest tile in the Completed Quests section.

## root cause
Custom quest completion classification/rendering timing could drift in test runs that combine async custom quest loading with timer control.

## fix
Revalidated classification/rendering flow and kept regression coverage focused on completed-vs-available custom quest separation in Quests tests.

## verification
`npm run test:root -- frontend/__tests__/Quests.test.js`
