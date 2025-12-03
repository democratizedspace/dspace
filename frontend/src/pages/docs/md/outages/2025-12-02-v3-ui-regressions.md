---
title: '2025-12-02 v3 UI regressions'
---

## Summary

The v3 UI refresh introduced a new header, theme toggle, wallet refactors, and navigation
adjustments. These shipped with several regressions:

-   Off-center brand alignment in the header when the dark-mode toggle rendered.
-   Wallet routing and layout gaps that left balances and basic income cards inaccessible.
-   Theme preference only applied to the current page and was lost after navigation.
-   A legacy Flywheel navigation link that pointed to a deprecated feature.

## Impact

Impact was limited to UI/UX polish. Simulation state, quest logic, and processes continued to work,
but users encountered visual drift, missing wallet content, and inconsistent theming across pages.

## Resolution

-   Rebuilt the header layout so the DSPACE brand stays centered while the toggle anchors to the
    right.
-   Restored the wallet page with current balances (dUSD, dBI, dOffset, dCarbon) and the basic income
    process card using v3 styling.
-   Centralized theme persistence with a shared helper and data attributes on the document and body,
    storing preferences under `dspace-theme` to prevent flash-of-wrong-theme on navigation.
-   Removed the Flywheel navigation entry and added regression coverage for navigation, wallet
    rendering, header alignment, and theme persistence.

## Lessons / follow-ups

-   Pair UI layout changes with viewport-aware regression tests to catch alignment issues early.
-   Keep navigation items aligned with active features to avoid dangling links.
-   Persist user-facing preferences (theme, layout) in a shared helper and assert them across routes in
    E2E coverage.
