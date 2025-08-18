---
title: 'User Journeys and Test Coverage'
slug: 'user-journeys'
---

# User journeys

This document tracks major journeys in DSPACE and whether a Playwright test covers each path.
Tests under `frontend/e2e/backlog` are planned but not yet automated.

| Journey                    | Playwright coverage | Test file                                         |
| -------------------------- | ------------------- | ------------------------------------------------- |
| Home page loads            | Yes                 | `frontend/e2e/home-page-basic.spec.ts`            |
| Docs navigation            | Yes                 | `frontend/e2e/docs-navigation.spec.ts`            |
| Built-in quest detail      | Yes                 | `frontend/e2e/builtin-quests.spec.ts`             |
| Quest list navigation      | Yes                 | `frontend/e2e/quests.spec.ts`                     |
| Tutorial quest run         | Yes                 | `frontend/e2e/tutorial-quest.spec.ts`             |
| Constellations quest       | Yes                 | `frontend/e2e/constellations-quest.spec.ts`       |
| Quest chat                 | Yes                 | `frontend/e2e/test-quest-chat.spec.ts`            |
| Custom content integration | Yes                 | `frontend/e2e/custom-content.spec.ts`             |
| Process creation           | Yes                 | `frontend/e2e/process-creation.spec.ts`           |
| Custom backup              | Yes                 | `frontend/e2e/custom-backup.spec.ts`              |
| Shop workflow              | Yes                 | `frontend/e2e/shop-functionality.spec.ts`         |
| Svelte component hydration | Yes                 | `frontend/e2e/svelte-component-hydration.spec.ts` |
| Page structure             | Yes                 | `frontend/e2e/page-structure.spec.ts`             |
| Error pages                | Yes                 | `frontend/e2e/error-pages.spec.ts`                |
| Cloud sync                 | No                  | --                                                |
| Manage items               | No                  | --                                                |
| Manage processes           | No                  | --                                                |
| Manage quests              | No                  | --                                                |
| Manage quests search       | No                  | --                                                |
| Quest PR form              | No                  | --                                                |
| Quest form validation      | No                  | --                                                |
| Quest PR validation        | No                  | --                                                |
| Quest success message      | No                  | --                                                |
| Item/process preview       | No                  | --                                                |
| Mobile item form           | No                  | --                                                |
| Mobile process form        | No                  | --                                                |
| Mobile quest form          | No                  | --                                                |
| Touch item selector        | No                  | --                                                |
| Touch menu navigation      | No                  | --                                                |
| UI responsiveness          | No                  | --                                                |
| Failover status page       | No                  | --                                                |
