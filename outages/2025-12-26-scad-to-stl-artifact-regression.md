# Build STL Artifacts shipped wrong carrier contents

## Summary
The scad-to-stl workflow for the sugarkube hardware artifacts stopped including the
`pi_carrier.scad` source in the stack bundle and mislabeled the carrier-level preview plates as
printable carriers. The stack artifact no longer shipped the source needed for the stack mounts and
exposed preview-only STLs in the carriers/ directory.

## Impact
- `stl-pi_cluster_stack` artifacts lacked `carriers/pi_carrier.scad`.
- Carrier-level preview STLs showed up under `carriers/` instead of the preview bundle.
- Consumers could not access the source file for the stack mounts and saw non-printable content in
  the carrier folder.

## Detection
- Manual inspection of the `stl-pi_cluster_stack` artifact from the
  `scad-to-stl.yml` workflow showed only `pi_carrier_stack_carrier_level_heatset.stl` and
  `pi_carrier_stack_carrier_level_printed.stl` inside `carriers/`.

## Root cause
`package_stl_artifacts.py` only copied the rendered STL variants from `stl/pi_cluster/` and never
copied the source `pi_carrier.scad`. It also grouped the `pi_carrier_stack_carrier_level_*` preview
plates under `carriers/`, which made the artifact look complete while hiding the actual SCAD.

## Resolution
- Added the SCAD source path (`cad/pi_cluster/pi_carrier.scad`) to the carriers layout in
  `scripts/package_stl_artifacts.py`.
- Moved the `pi_carrier_stack_carrier_level_heatset.stl` and
  `pi_carrier_stack_carrier_level_printed.stl` files into the `preview/` bundle to match their
  intended role.
- Documented the expected artifact tree and the packaging command in
  `docs/ops/scad-to-stl-artifacts.md`.

## Verification
- Packaging helper now copies `pi_carrier.scad` into the carriers bundle and routes the
  carrier-level plates into `preview/` via `scripts/package_stl_artifacts.py`.
- Next workflow run should emit `carriers/pi_carrier.scad` in `stl-pi_cluster_stack` with the
  carrier-level STLs under `preview/`; spot-check that artifact before shipping prints.
