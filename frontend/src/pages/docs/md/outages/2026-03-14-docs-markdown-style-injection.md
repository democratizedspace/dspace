---
title: 'Docs markdown style injection caused NPC image float regression (2026-03-14)'
slug: '2026-03-14-docs-markdown-style-injection'
summary: 'Embedded <style> tags inside markdown overrode doc layout CSS, causing images on /docs/npcs to float beside text and break vertical flow.'
---

## Summary

`/docs/npcs` rendered NPC portraits as floated images beside paragraphs instead of stacked blocks.
The issue was visible in staging and came from markdown-level CSS overriding page-level docs styles.

## Impact

- NPC bios on `/docs/npcs` became harder to read because text wrapped around portraits.
- Any docs page with embedded `<style>` could override shared docs presentation unexpectedly.

## Root cause

The docs renderer (`/docs/[slug]`) accepted compiled markdown HTML without sanitizing `<style>` tags.
`frontend/src/pages/docs/md/npcs.md` included:

```html
<style>
    img {
        float: left;
        width: 150px;
        margin: 10px;
        border-radius: 20px;
    }
</style>
```

That markdown-scoped style leaked into the rendered page and forced image float behavior.

## Resolution

- Added a shared docs sanitizer that strips `<style>` and `<script>` tags from compiled markdown HTML.
- Wired the sanitizer into both docs routes:
    - `/docs/[slug]`
    - `/docs/outages/[slug]`
- Added regression tests to assert style/script tags are removed while content remains.

## Follow-up

- Keep styling in route/component CSS, not markdown bodies.
- Use class-safe markdown where needed, but do not embed raw `<style>` blocks in docs content.
