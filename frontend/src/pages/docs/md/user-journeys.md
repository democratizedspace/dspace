---
title: 'User Journeys and Test Coverage'
slug: 'user-journeys'
---

# User Journeys

This document tracks major journeys in DSPACE and whether a Playwright test covers each path.
`frontend/e2e` is the source of truth for the full test suite; the table below calls out core
journeys so we can keep them visible during docs reviews.

If a new journey has no automation yet, add a placeholder spec under `frontend/e2e/backlog` and
move it into `frontend/e2e` with `git mv` once coverage exists. The backlog is currently empty,
aside from shared helpers, because every listed journey has live coverage.

| Journey                    | Playwright coverage | Test file                                     |
| -------------------------- | ------------------- | --------------------------------------------- |
| About page loads           | Yes                 | `frontend/e2e/docs-navigation.spec.ts`        |
| Authentication flow        | Yes                 | `frontend/e2e/authentication-flow.spec.ts`    |
| Built-in quest details     | Yes                 | `frontend/e2e/builtin-quests.spec.ts`         |
| Changelog page loads       | Yes                 | `frontend/e2e/docs-changelog.spec.ts`         |
| Chat persona switching     | Yes                 | `frontend/e2e/chat-persona-switching.spec.ts` |
| Cloud sync                 | Yes                 | `frontend/e2e/cloud-sync.spec.ts`             |
| Cookie consent flow        | Yes                 | `frontend/e2e/cookie-consent.spec.ts`         |
| Custom backup              | Yes                 | `frontend/e2e/custom-backup.spec.ts`          |
| Custom content integration | Yes                 | `frontend/e2e/custom-content.spec.ts`         |
| Custom quest chat          | Yes                 | `frontend/e2e/custom-quest-chat.spec.ts`      |
| Docs landing page loads    | Yes                 | `frontend/e2e/docs-navigation.spec.ts`        |
| Docs search                | Yes                 | `frontend/e2e/docs-search.spec.ts`            |
| Error pages                | Yes                 | `frontend/e2e/error-pages.spec.ts`            |
| Failover status page       | Yes                 | `frontend/e2e/failover-status.spec.ts`        |
| Home page loads            | Yes                 | `frontend/e2e/home-page-basic.spec.ts`        |
| Item preview               | Yes                 | `frontend/e2e/item-preview.spec.ts`           |
| Legacy data import         | Yes                 | `frontend/e2e/legacy-import.spec.ts`          |
| Manage items               | Yes                 | `frontend/e2e/manage-items.spec.ts`           |
| Manage processes           | Yes                 | `frontend/e2e/manage-processes.spec.ts`       |
| Process creation           | Yes                 | `frontend/e2e/process-creation.spec.ts`       |
| Process preview            | Yes                 | `frontend/e2e/process-preview.spec.ts`        |
| Quest list navigation      | Yes                 | `frontend/e2e/quests.spec.ts`                 |
| Quest PR form              | Yes                 | `frontend/e2e/quest-pr-form.spec.ts`          |
| Quest success message      | Yes                 | `frontend/e2e/quest-success-message.spec.ts`  |
| Settings page loads        | Yes                 | `frontend/e2e/settings-page.spec.ts`          |
| Shop workflow              | Yes                 | `frontend/e2e/shop-functionality.spec.ts`     |
| UI responsiveness          | Yes                 | `frontend/e2e/ui-responsiveness.spec.ts`      |
| User journeys doc loads    | Yes                 | `frontend/e2e/user-journeys-doc.spec.ts`      |
