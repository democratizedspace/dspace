---
title: 'Changelog image cap regression from PR #4173 (2026-03-30)'
slug: '2026-03-30-changelog-image-cap-regression'
summary: 'PR #4173 attempted to cap markdown images at 512px globally, which failed for /changelog and made /docs/custom-content visuals too small.'
---

# Changelog image cap regression from PR #4173 (2026-03-30)

- **Summary**: PR #4173 attempted to solve stretched changelog imagery by applying a broad markdown image max-width cap. On staging (`v3-034ebf8`), the `/changelog` release image still stretched too wide while the `/docs/custom-content` lead image became too small to read.
- **Impact**:
    - `/changelog#20260401`: hero release art remained oversized and visually overwhelming.
    - `/docs/custom-content`: first instructional image was constrained to 512px and lost readability on desktop.
- **Root cause**:
    - The fix used a generic image cap strategy (`max-width: 512px`) across docs markdown surfaces, which was too blunt for mixed content types.
    - Changelog and docs pages need different image behavior: release-art should be constrained, while instructional diagrams/screenshots should remain naturally sized.
- **Resolution implemented**:
    - Introduced **targeted** release-art behavior by adding a `release-art` class to the April 1, 2026 changelog hero image.
    - Updated `/changelog` styling to only cap `img.release-art` at 512px.
    - Reverted generic docs image cap so `/docs/custom-content` images can render at natural responsive sizes (`max-width: 100%`).
- **Test strategy and regression prevention**:
    - Updated Playwright coverage in `frontend/e2e/docs-changelog.spec.ts`.
    - Regression checks now assert both sides of the contract:
        - Changelog release art (`.entry-body img.release-art`) is capped at `<= 512px`.
        - The first `/docs/custom-content` image renders wider than `512px` on desktop viewport, confirming we no longer over-constrain instructional content.
    - This keeps the layout intent explicit and prevents future blanket CSS regressions.
