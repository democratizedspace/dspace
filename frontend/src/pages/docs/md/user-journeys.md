---
title: 'User Journeys and Test Coverage'
slug: 'user-journeys'
---

# User Journeys

This document tracks major journeys in DSPACE and whether a Playwright test covers each path.
Uncovered journeys must ship a placeholder spec in `frontend/e2e/backlog/` until automation exists;
move that spec to `frontend/e2e/` once coverage lands. Entries are sorted alphabetically by journey
name.

| Journey                    | Playwright coverage | Test file                                         |
| -------------------------- | ------------------- | ------------------------------------------------- |
| About page loads           | Yes                 | `frontend/e2e/docs-navigation.spec.ts`            |
| Authentication flow        | Yes                 | `frontend/e2e/authentication-flow.spec.ts`        |
| Built-in quest details     | Yes                 | `frontend/e2e/builtin-quests.spec.ts`             |
| Changelog page loads       | No                  | --                                                |
| Cloud sync                 | Yes                 | `frontend/e2e/cloud-sync.spec.ts`                 |
| Constellations quest       | Yes                 | `frontend/e2e/constellations-quest.spec.ts`       |
| Cookie consent flow        | Yes                 | `frontend/e2e/cookie-consent.spec.ts`             |
| Custom backup              | Yes                 | `frontend/e2e/custom-backup.spec.ts`              |
| Custom content integration | Yes                 | `frontend/e2e/custom-content.spec.ts`             |
| Dark mode toggle           | No                  | --                                                |
| Docs landing page loads    | Yes                 | `frontend/e2e/docs-navigation.spec.ts`            |
| Docs navigation            | Yes                 | `frontend/e2e/docs-navigation.spec.ts`            |
| Docs search                | No                  | --                                                |
| Error pages                | Yes                 | `frontend/e2e/error-pages.spec.ts`                |
| Failover status page       | Yes                 | `frontend/e2e/failover-status.spec.ts`            |
| Glossary page loads        | Yes                 | `frontend/e2e/glossary-doc.spec.ts`               |
| Home page loads            | Yes                 | `frontend/e2e/home-page-basic.spec.ts`            |
| Item preview               | Yes                 | `frontend/e2e/item-preview.spec.ts`               |
| Legacy data import         | Yes                 | `frontend/e2e/legacy-import.spec.ts`              |
| Logout flow                | No                  | --                                                |
| Manage items               | Yes                 | `frontend/e2e/manage-items.spec.ts`               |
| Manage processes           | Yes                 | `frontend/e2e/manage-processes.spec.ts`           |
| Manage quests              | No                  | --                                                |
| Manage quests search       | No                  | --                                                |
| Mobile item form           | No                  | --                                                |
| Mobile process form        | No                  | --                                                |
| Mobile quest form          | No                  | --                                                |
| Page structure             | Yes                 | `frontend/e2e/page-structure.spec.ts`             |
| Process creation           | Yes                 | `frontend/e2e/process-creation.spec.ts`           |
| Process preview            | Yes                 | `frontend/e2e/manage-processes.spec.ts`           |
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
| UI responsiveness          | Yes                 | `frontend/e2e/ui-responsiveness.spec.ts`          |
| User journeys doc loads    | Yes                 | `frontend/e2e/user-journeys-doc.spec.ts`          |
