---
title: 'Docs image width cap regression (2026-03-30)'
slug: '2026-03-30-docs-image-width-cap-regression'
summary: 'A broad 512px markdown image cap was applied to docs, changelog, and outages pages. The changelog hero image still appeared wrong on staging while `/docs/custom-content` screenshots became too small to read.'
---

# Docs image width cap regression (2026-03-30)

- **Summary**: PR #4173 attempted to fix an oversized changelog hero image by applying a blanket `max-width: 512px` rule to markdown images on changelog/docs pages.
- **Impact**:
    - `/docs/custom-content` screenshots were constrained to a narrow column and became hard to read.
    - The specific changelog image issue remained effectively unresolved from a product perspective because the fix was too broad and not tied to the actual problematic asset.
- **Root cause**:
    - The prior change targeted every markdown image instead of the single hero image that needed special treatment.
    - A broad cap introduced collateral regressions in docs content where larger, readable screenshots are expected.
    - The regression test only asserted "all docs images <= 512px", which encoded the wrong behavior and could not catch readability regressions.
- **Resolution implemented**:
    - Reverted markdown image styling in shared docs/changelog/outages containers to `max-width: 100%` so images render at natural size while still staying responsive.
    - Added an explicit `width="512"` attribute directly on the intended changelog hero image (`/assets/changelog/20260401/democratizedspace.jpg`) so the cap is asset-specific and deterministic.
    - Updated Playwright coverage to validate both sides of the requirement:
        1. The targeted changelog hero image remains capped at `<= 512px`.
        2. The first `/docs/custom-content` image renders larger than `512px` at desktop viewport (protects screenshot readability).
- **Why this is more robust**:
    - Behavior now follows content intent: one targeted cap for a single hero asset, no global markdown image restriction.
    - Tests now assert both the positive requirement (hero cap) and a negative regression guard (docs screenshots not globally constrained).
- **Prevention / follow-up**:
    - Avoid global markdown image caps unless all docs owners agree on a single universal policy.
    - Keep visual constraints as close as possible to the specific content (e.g., per-image width attribute or dedicated class) and verify with page-level E2E checks.
