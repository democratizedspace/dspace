---
title: 'Changelog image sizing fix regressed docs readability (2026-03-30)'
slug: '2026-03-30-changelog-image-width-regression'
summary: 'A broad 512px markdown image cap fixed one changelog image but unintentionally shrank docs images; the fix scopes the cap to the single affected changelog asset and adds targeted E2E coverage.'
---

# Changelog image sizing fix regressed docs readability (2026-03-30)

- **Summary**: The previous image-width fix did not resolve the stretching behavior on the homepage latest-update card and also made `/docs/custom-content` screenshots too small to read.
- **Impact**:
    - `/` still stretched `/assets/changelog/20260401/democratizedspace.jpg` to container width.
    - Docs pages, including `/docs/custom-content`, inherited a 512px max-width cap that reduced readability.
- **Root cause**:
    - The homepage renderer (`WhatsNew.astro`) injected `img { width: 100%; }` into compiled changelog HTML, so the homepage latest-update card kept stretching the April 1 hero even after PR #4173.
    - A global markdown image cap (`max-width: min(100%, 512px)`) was applied in shared docs/changelog templates, so unrelated docs content was constrained.
- **Resolution**:
    - Replaced global `width: 100%` homepage image styling with intrinsic/responsive defaults (`max-width: 100%; width: auto; height: auto`).
    - Added an explicit image-level hook on the April 1 hero (`.changelog-hero-image--20260401`) and scoped the 512px cap to that hook on both homepage and `/changelog`.
    - Removed the global 512px cap from docs and outage markdown rendering so normal documentation imagery can use natural width.
- **Test strategy and regression prevention**:
    - Updated Playwright coverage in `frontend/e2e/docs-changelog.spec.ts` to assert:
        1. The targeted changelog image remains capped at `<= 512px` on `/` (homepage latest update).
        2. The same hook remains capped at `<= 512px` on `/changelog`.
        3. `/docs/custom-content` images are no longer hard-capped to `512px` and render above `512px` when the source image is wider.
    - This mix of positive + negative assertions prevents both prior failure modes (stretching on changelog and over-constraining docs).
- **Lessons**:
    - Avoid global markdown image caps when only one asset is problematic.
    - Use asset-scoped selectors for one-off layout exceptions and keep docs defaults broadly readable.
