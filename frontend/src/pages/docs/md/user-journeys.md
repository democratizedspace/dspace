---
title: 'User Journeys and Test Coverage'
slug: 'user-journeys'
---

# User journeys

This document tracks major journeys in DSPACE and whether a Playwright test covers each path.
Tests under `frontend/e2e/backlog` are placeholders for journeys without automation. When adding
coverage, move the placeholder with `git mv` to `frontend/e2e` and ensure the test asserts visible
UI content. Entries are sorted alphabetically by journey name.

| Journey                    | Playwright coverage | Test file                                         |
| -------------------------- | ------------------- | ------------------------------------------------- |
| About page loads           | Yes                 | `frontend/e2e/docs-navigation.spec.ts`            |
| Authentication flow        | Yes                 | `frontend/e2e/authentication-flow.spec.ts`        |
| Built-in quest details     | Yes                 | `frontend/e2e/builtin-quests.spec.ts`             |
| Cloud sync                 | Yes                 | `frontend/e2e/cloud-sync.spec.ts`                 |
| Constellations quest       | Yes                 | `frontend/e2e/constellations-quest.spec.ts`       |
| Cookie consent flow        | Yes                 | `frontend/e2e/cookie-consent.spec.ts`             |
| Custom backup              | Yes                 | `frontend/e2e/custom-backup.spec.ts`              |
| Custom content integration | Yes                 | `frontend/e2e/custom-content.spec.ts`             |
| Docs landing page loads    | Yes                 | `frontend/e2e/docs-navigation.spec.ts`            |
| Docs navigation            | Yes                 | `frontend/e2e/docs-navigation.spec.ts`            |
| Error pages                | Yes                 | `frontend/e2e/error-pages.spec.ts`                |
| Failover status page       | Yes                 | `frontend/e2e/failover-status.spec.ts`            |
| FAQ page loads             | No                  | --                                                |
| Glossary page loads        | No                  | --                                                |
| Home page loads            | Yes                 | `frontend/e2e/home-page-basic.spec.ts`            |
| Item/process preview       | Yes                 | `frontend/e2e/item-process-preview.spec.ts`       |
| Legacy data import         | No                  | --                                                |
| Manage items               | No                  | --                                                |
| Manage processes           | No                  | --                                                |
| Manage quests              | No                  | --                                                |
| Manage quests search       | No                  | --                                                |
| Mobile item form           | No                  | --                                                |
| Mobile process form        | No                  | --                                                |
| Mobile quest form          | No                  | --                                                |
| Page structure             | Yes                 | `frontend/e2e/page-structure.spec.ts`             |
| Process creation           | Yes                 | `frontend/e2e/process-creation.spec.ts`           |
| Profile avatar selection   | Yes                 | `frontend/e2e/profile-avatar-selection.spec.ts`   |
| Profile page loads         | Yes                 | `frontend/e2e/profile-page.spec.ts`               |
| Quest chat                 | Yes                 | `frontend/e2e/test-quest-chat.spec.ts`            |
| Quest form validation      | No                  | --                                                |
| Quest list navigation      | Yes                 | `frontend/e2e/quests.spec.ts`                     |
| Quest PR form              | No                  | --                                                |
| Quest PR validation        | No                  | --                                                |
| Quest success message      | No                  | --                                                |
| Settings page loads        | Yes                 | `frontend/e2e/settings-page.spec.ts`              |
| Shop workflow              | Yes                 | `frontend/e2e/shop-functionality.spec.ts`         |
| Svelte component hydration | Yes                 | `frontend/e2e/svelte-component-hydration.spec.ts` |
| Touch item selector        | No                  | --                                                |
| Touch menu navigation      | No                  | --                                                |
| Tutorial quest run         | Yes                 | `frontend/e2e/tutorial-quest.spec.ts`             |
| UI responsiveness          | No                  | --                                                |
