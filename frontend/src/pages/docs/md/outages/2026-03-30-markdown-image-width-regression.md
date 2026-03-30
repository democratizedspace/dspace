---
title: 'Markdown image width regression after PR #4173 (2026-03-30)'
slug: '2026-03-30-markdown-image-width-regression'
summary: 'PR #4173 attempted a global 512px max-width policy for markdown images. The changelog hero image still rendered too wide on staging, while docs screenshots became too small to read.'
---

# Markdown image width regression after PR #4173 (2026-03-30)

- **Summary**: The image sizing fix in PR #4173 did not achieve the intended result on `/changelog` and caused readability regressions on `/docs/custom-content`.
- **Impact**:
    - `/changelog` still rendered `/assets/changelog/20260401/democratizedspace.jpg` as a very wide hero image on staging.
    - `/docs/custom-content` screenshots were globally capped to 512px and became too small to read comfortably on desktop.
- **Root cause**:
    - The prior fix used one broad rule for all docs markdown images (`max-width: min(100%, 512px)`), which was too aggressive for documentation screenshots that should usually render larger.
    - The changelog cap relied on a generic selector instead of an explicit image-level hook, so the critical hero image behavior was not guarded with route-specific targeting.
- **Resolution**:
    - Replaced the docs markdown rule with natural responsive sizing (`max-width: 100%; width: auto; height: auto`) in `frontend/src/pages/docs/[slug].astro`.
    - Added an explicit class (`changelog-feature-image`) to the April 1, 2026 changelog hero image and capped only that image at 512px in `frontend/src/pages/changelog.astro`.
    - Updated Playwright coverage in `frontend/e2e/docs-changelog.spec.ts`:
        - Asserts changelog feature image width is `<= 512`.
        - Asserts first `/docs/custom-content` image width is `> 512` at desktop viewport to prevent unreadable downsizing regressions.
- **Lessons**:
    - Avoid global hard caps for mixed-content docs pages (illustrations, screenshots, diagrams) unless all assets share the same readability target.
    - Use explicit, testable hooks for one-off presentation constraints on high-visibility content.
- **Prevention**:
    - Keep route-specific image policies:
        - `/changelog`: constrain only designated hero-style images.
        - `/docs/[slug]`: preserve natural responsive sizing for most documentation media.
    - Preserve E2E assertions that validate both sides of the contract (capped changelog hero + readable docs screenshots).
