---
title: 'User Journeys and Test Coverage'
slug: 'user-journeys'
---

# User Journeys

This document highlights a curated set of player journeys and the Playwright tests that cover
those paths. It is **not** an exhaustive inventory of every E2E spec.

**Source of truth**

- All Playwright specs live in `frontend/e2e`.
- `frontend/scripts/run-test-groups.mjs` lists every spec included in the `npm test` workflow.
- `frontend/e2e/test-coverage.spec.ts` fails if a spec is missing from the test groups.

When you add a new journey, create a `.spec.ts` file in `frontend/e2e` and wire it into
`frontend/scripts/run-test-groups.mjs` so it runs in CI.

## Curated coverage map

| Journey                    | Playwright coverage | Test file                                         |
| -------------------------- | ------------------- | ------------------------------------------------- |
| About page loads           | Yes                 | `frontend/e2e/docs-navigation.spec.ts`            |
| Authentication flow        | Yes                 | `frontend/e2e/authentication-flow.spec.ts`        |
| Built-in quest details     | Yes                 | `frontend/e2e/builtin-quests.spec.ts`             |
| Changelog page loads       | Yes                 | `frontend/e2e/docs-changelog.spec.ts`             |
| Chat persona switching     | Yes                 | `frontend/e2e/chat-persona-switching.spec.ts`     |
| Cloud sync                 | Yes                 | `frontend/e2e/cloud-sync.spec.ts`                 |
| Constellations quest       | Yes                 | `frontend/e2e/constellations-quest.spec.ts`       |
| Cookie consent flow        | Yes                 | `frontend/e2e/cookie-consent.spec.ts`             |
| Custom backup              | Yes                 | `frontend/e2e/custom-backup.spec.ts`              |
| Custom content integration | Yes                 | `frontend/e2e/custom-content.spec.ts`             |
| Dark mode toggle           | Yes                 | `frontend/e2e/dark-mode-toggle.spec.ts`           |
| Docs landing page loads    | Yes                 | `frontend/e2e/docs-navigation.spec.ts`            |
| Docs navigation            | Yes                 | `frontend/e2e/docs-navigation.spec.ts`            |
| Docs search                | Yes                 | `frontend/e2e/docs-search.spec.ts`                |
| Error pages                | Yes                 | `frontend/e2e/error-pages.spec.ts`                |
| Failover status page       | Yes                 | `frontend/e2e/failover-status.spec.ts`            |
| Glossary page loads        | Yes                 | `frontend/e2e/glossary-doc.spec.ts`               |
| Home page loads            | Yes                 | `frontend/e2e/home-page-basic.spec.ts`            |
| Item preview               | Yes                 | `frontend/e2e/item-preview.spec.ts`               |
| Legacy data import         | Yes                 | `frontend/e2e/legacy-import.spec.ts`              |
| Logout flow                | Yes                 | `frontend/e2e/logout-flow.spec.ts`                |
| Manage items               | Yes                 | `frontend/e2e/manage-items.spec.ts`               |
| Manage processes           | Yes                 | `frontend/e2e/manage-processes.spec.ts`           |
| Manage quests              | Yes                 | `frontend/e2e/manage-quests.spec.ts`              |
| Manage quests search       | Yes                 | `frontend/e2e/manage-quests-search.spec.ts`       |
| Mobile item form           | Yes                 | `frontend/e2e/mobile-item-form.spec.ts`           |
| Mobile process form        | Yes                 | `frontend/e2e/mobile-process-form.spec.ts`        |
| Mobile quest form          | Yes                 | `frontend/e2e/mobile-quest-form.spec.ts`          |
| Page structure             | Yes                 | `frontend/e2e/page-structure.spec.ts`             |
| Process creation           | Yes                 | `frontend/e2e/process-creation.spec.ts`           |
| Process preview            | Yes                 | `frontend/e2e/process-preview.spec.ts`            |
| Profile avatar selection   | Yes                 | `frontend/e2e/profile-avatar-selection.spec.ts`   |
| Profile page loads         | Yes                 | `frontend/e2e/profile-page.spec.ts`               |
| Quest chat                 | Yes                 | `frontend/e2e/test-quest-chat.spec.ts`            |
| Quest form validation      | Yes                 | `frontend/e2e/quest-form-validation.spec.ts`      |
| Quest list navigation      | Yes                 | `frontend/e2e/quests.spec.ts`                     |
| Quest PR form              | Yes                 | `frontend/e2e/quest-pr-form.spec.ts`              |
| Quest PR validation        | Yes                 | `frontend/e2e/quest-pr-validation.spec.ts`        |
| Quest success message      | Yes                 | `frontend/e2e/quest-success-message.spec.ts`      |
| Settings page loads        | Yes                 | `frontend/e2e/settings-page.spec.ts`              |
| Shop workflow              | Yes                 | `frontend/e2e/shop-functionality.spec.ts`         |
| Svelte component hydration | Yes                 | `frontend/e2e/svelte-component-hydration.spec.ts` |
| Touch item selector        | Yes                 | `frontend/e2e/touch-item-selector.spec.ts`        |
| Touch menu navigation      | Yes                 | `frontend/e2e/touch-menu.spec.ts`                 |
| Tutorial quest run         | Yes                 | `frontend/e2e/tutorial-quest.spec.ts`             |
| UI responsiveness          | Yes                 | `frontend/e2e/ui-responsiveness.spec.ts`          |
| User journeys doc loads    | Yes                 | `frontend/e2e/user-journeys-doc.spec.ts`          |
