---
title: '2025-12-26 – Sugarkube scad-to-stl artifact'
slug: '2025-12-26-sugarkube-scad-artifact'
summary: 'Restored pi_carrier.scad to stl-pi_cluster_stack and moved preview-only STLs into preview/.'
---

## Summary

- `stl-pi_cluster_stack` artifact stopped including `carriers/pi_carrier.scad` and only shipped
  preview carrier renders in `carriers/`.
- Preview-only STLs belonged under `preview/`, which made the artifact layout confusing.

## Impact

- Users could not download the stack-mount SCAD and might grab preview-only STLs from the
  carriers folder.

## Resolution

- Added `carriers/pi_carrier.scad` back to the artifact upload set.
- Moved the render-only carrier STLs into `preview/` and reran the workflow to verify the
  layout.

## Follow-ups

- Keep printable artifacts and previews separated in upload globs to prevent future mix-ups.
