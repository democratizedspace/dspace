# Sugarkube scad-to-stl artifact lost pi_carrier.scad

## Summary
- `stl-pi_cluster_stack` artifact stopped shipping `carriers/pi_carrier.scad` after preview
  glob changes and only included render-only carrier STLs.
- The mis-packaged carrier renders also stayed under `carriers/` instead of the `preview/`
  folder, making it unclear which files were printable.

## Impact
- Downstream users could not retrieve the stack-mount `pi_carrier.scad` model from the
  artifact and risked grabbing preview-only STLs from `carriers/`.
- Raspi stack builds depending on the SCAD source stalled until the artifact layout was
  corrected.

## Detection
- Manual inspection of the latest `stl-pi_cluster_stack` artifact showed only
  `pi_carrier_stack_carrier_level_heatset.stl` and `pi_carrier_stack_carrier_level_printed.stl`
  under `carriers/` with no `pi_carrier.scad` present.

## Root cause
- Preview glob edits in the scad-to-stl workflow filtered out `carriers/pi_carrier.scad` and
  left preview renders inside the `carriers/` directory instead of moving them to `preview/`.

## Resolution
- Added `carriers/pi_carrier.scad` back to the artifact upload set.
- Relocated the render-only carrier previews into the `preview/` folder so carriers/ only
  holds printable sources.
- Re-ran the `stl-pi_cluster_stack` job to confirm the artifact now includes the SCAD and the
  preview STLs are isolated.

## Follow-ups
- Keep preview uploads and printable outputs in separate globs to avoid mixing renders with
  source files during future refactors.
