---
title: '2025-12-02 – v3 UI regressions'
slug: '2025-12-02-v3-ui-regressions'
summary: 'Fixed v3 header, wallet routing, theme persistence, and Flywheel nav drift.'
---

## Summary

-   v3 refreshed the header and dark-mode toggle but left the brand stack off-center.
-   Wallet routing regressed, hiding balances (dUSD/dBI) and the basic income card.
-   Theme selection was applied per page without persisting across navigation.
-   A deprecated Flywheel link stayed in navigation despite the feature being removed.

## Impact

-   UI/UX polish degraded: misaligned branding, missing wallet surface, and inconsistent theme
    state when changing pages. Core simulations and processes continued to function.

## Resolution

-   Rebuilt the header layout to center the brand while isolating the toggle in the top-right.
-   Restored the Wallet page with live balances and the basic income launcher.
-   Centralized theme storage in `localStorage` (`dspace-theme`) and applied it to the document
    root/body on load and navigation.
-   Removed the Flywheel navigation entry and guarded against the legacy route.
-   Added Playwright regression coverage for the header, wallet, theme persistence, and Flywheel
    removal.

## Lessons / Follow-ups

-   Pair structural UI changes with regression tests that assert layout regions and navigation
    entries.
-   Keep navigation in sync with the active feature set to avoid dead ends.
-   Persist user-facing preferences (like theme) in one place and hydrate them before rendering
    to prevent flashes of incorrect styles.
