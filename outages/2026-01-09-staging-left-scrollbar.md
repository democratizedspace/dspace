# Staging scrollbar rendered on the left (2026-01-09)

## Summary
A visual regression on staging rendered the primary page scrollbar on the left side of the
viewport with a large white track, despite page content remaining functional. The issue was
introduced after PR #2738 updated the Page layout to use list-based sections and safe-area
padding.

## Impact
- Staging UI looked broken/confusing because the main scrollbar appeared on the left.
- Core gameplay flows were still functional, but the UI regression reduced confidence in the
  release candidate.

## Detection
- Reported by a staging reviewer shortly after the PR #2738 deploy.

## Root cause
- PR #2738 refactored `frontend/src/components/Page.astro` to wrap page sections in list
  elements and adjust padding. The layout refactor relied on inherited document direction,
  and the root element ended up with RTL direction in staging. This flipped the document
  scrollbar to the left.

## Resolution
- Explicitly set the document direction to LTR in `frontend/src/layouts/Layout.astro` so the
  root element cannot inherit RTL direction unintentionally.
- Added Playwright coverage to assert the document direction is `ltr` on the homepage.

## Follow-ups
- Extend QA checklist to spot-check scrollbar placement after layout or global CSS changes.
- Review future Page/layout refactors for global direction/overflow side effects before
  merging.
