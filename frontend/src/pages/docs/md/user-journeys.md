---
title: 'User Journeys and Test Coverage'
slug: 'user-journeys'
---

# User journeys

This document tracks major journeys in DSPACE and whether a Playwright test covers each path.

| Journey                    | Playwright coverage | Test file                                            |
| -------------------------- | ------------------- | ---------------------------------------------------- |
| Home page loads            | No                  | `frontend/e2e/backlog/home-page-basic.spec.ts`       |
| Docs navigation            | No                  | `frontend/e2e/backlog/docs-navigation.spec.ts`       |
| Built-in quest detail      | Yes                 | `frontend/e2e/builtin-quests.spec.ts`                |
| Quest list navigation      | Yes                 | `frontend/e2e/quests.spec.ts`                        |
| Tutorial quest run         | Yes                 | `frontend/e2e/tutorial-quest.spec.ts`                |
| Constellations quest       | Yes                 | `frontend/e2e/constellations-quest.spec.ts`          |
| Quest chat                 | Yes                 | `frontend/e2e/test-quest-chat.spec.ts`               |
| Custom content integration | Yes                 | `frontend/e2e/custom-content.spec.ts`                |
| Process creation           | Yes                 | `frontend/e2e/process-creation.spec.ts`              |
| Custom backup              | Yes                 | `frontend/e2e/custom-backup.spec.ts`                 |
| Shop workflow              | Yes                 | `frontend/e2e/shop-functionality.spec.ts`            |
| Svelte component hydration | Yes                 | `frontend/e2e/svelte-component-hydration.spec.ts`    |
| Page structure             | Yes                 | `frontend/e2e/page-structure.spec.ts`                |
| Cloud sync                 | No                  | `frontend/e2e/backlog/cloud-sync.spec.ts`            |
| Manage items               | No                  | `frontend/e2e/backlog/manage-items.spec.ts`          |
| Manage processes           | No                  | `frontend/e2e/backlog/manage-processes.spec.ts`      |
| Manage quests              | No                  | `frontend/e2e/backlog/manage-quests.spec.ts`         |
| Manage quests search       | No                  | `frontend/e2e/backlog/manage-quests-search.spec.ts`  |
| Quest PR form              | No                  | `frontend/e2e/backlog/quest-pr-form.spec.ts`         |
| Quest form validation      | No                  | `frontend/e2e/backlog/quest-form-validation.spec.ts` |
| Quest PR validation        | No                  | `frontend/e2e/backlog/quest-pr-validation.spec.ts`   |
| Quest success message      | No                  | `frontend/e2e/backlog/quest-success-message.spec.ts` |
| Item/process preview       | No                  | `frontend/e2e/backlog/item-process-preview.spec.ts`  |
| Mobile item form           | No                  | `frontend/e2e/backlog/mobile-item-form.spec.ts`      |
| Mobile process form        | No                  | `frontend/e2e/backlog/mobile-process-form.spec.ts`   |
| Mobile quest form          | No                  | `frontend/e2e/backlog/mobile-quest-form.spec.ts`     |
| Touch item selector        | No                  | `frontend/e2e/backlog/touch-item-selector.spec.ts`   |
| Touch menu navigation      | No                  | `frontend/e2e/backlog/touch-menu.spec.ts`            |
| UI responsiveness          | No                  | `frontend/e2e/backlog/ui-responsiveness.spec.ts`     |
| Failover status page       | No                  | `frontend/e2e/backlog/failover-status.spec.ts`       |
