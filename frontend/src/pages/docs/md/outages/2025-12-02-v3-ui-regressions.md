---
title: 'December 2, 2025 – v3 UI regressions'
slug: '2025-12-02-v3-ui-regressions'
---

## Summary

The v3 header refresh and navigation tweaks introduced several UI regressions compared to v2.1:

-   Brand stack shifted off-center after adding the dark-mode toggle.
-   `/wallet` no longer rendered the balances or basic income card players expect.
-   Theme toggling updated only the current page and did not persist between navigations.
-   The deprecated Flywheel link still appeared in navigation even though the feature was removed.

## Impact

The issues were limited to presentation and navigation. Simulation logic, inventory state, and quest
data remained intact.

## Resolution

-   Reworked the header layout to keep the brand centered while positioning the toggle at the top
    right.
-   Restored the wallet route with balance summaries and the basic income process card using the v3
    visual system.
-   Centralized theme helpers so dark/light preference persists via `dspace-theme` across reloads and
    route changes, applying the selection to the document root and body.
-   Removed the Flywheel navigation entry and added regression tests for the above behaviors.

## Lessons / follow-ups

Guard UI structure changes with regression tests, especially around navigation and shared layout
components, and keep the navigation menu aligned with the active feature set.
