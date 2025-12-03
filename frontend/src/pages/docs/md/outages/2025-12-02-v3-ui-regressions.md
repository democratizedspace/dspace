---
title: '2025-12-02 – v3 UI regressions'
slug: '2025-12-02-v3-ui-regressions'
---

# 2025-12-02 – v3 UI regressions

## Summary

-   v3 shipped a refreshed header and dark-mode toggle that left the DSPACE brand stack off-center.
-   The wallet route regressed to a 404 with missing balances and process guidance.
-   Theme toggles did not persist across navigation, causing unexpected flashes after reloads.
-   A deprecated Flywheel nav link lingered even though the feature was removed from the product.

## Impact

-   UI and UX regressions only; gameplay logic and simulations remained correct.
-   Players saw misaligned branding, broken wallet navigation, and inconsistent theming.

## Resolution

-   Realigned the header with a centered brand column and isolated toggle container.
-   Restored the wallet page with balance tiles and basic-income/conversion actions.
-   Centralized theme helpers to store `dspace-theme` in localStorage and apply it to the DOM on load.
-   Removed Flywheel from navigation and added regression coverage via Playwright.

## Lessons / follow-ups

-   Pair layout changes with viewport regression tests that assert positioning, not just visibility.
-   Keep navigation entries tied to active features to avoid dead-end routes.
-   Persist theme and personalization choices through a shared helper to avoid divergent behaviors.
