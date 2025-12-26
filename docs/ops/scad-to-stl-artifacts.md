# STL artifact layout for Pi cluster hardware

The Build STL Artifacts workflow in
[`futuroptimist/sugarkube`](https://github.com/futuroptimist/sugarkube/actions/workflows/scad-to-stl.yml)
packages printed parts for the Pi cluster stack and enclosure. The packaging step regressed by
dropping the source `pi_carrier.scad` and keeping the carrier-level preview plates in the
`carriers/` folder instead of `preview/`.

## Fixed layout

Use the updated `scripts/package_stl_artifacts.py` to stage artifacts so the carrier bundle ships
the real source SCAD while the preview bundle holds the non-printable carrier-level plates:

- `dist/stl_artifacts/pi_cluster_stack/carriers/pi_carrier.scad`
- `dist/stl_artifacts/pi_cluster_stack/posts/pi_carrier_stack_post.stl`
- `dist/stl_artifacts/pi_cluster_stack/fan_adapters/pi_carrier_stack_fan_adapter.stl`
- `dist/stl_artifacts/pi_cluster_stack/fan_walls/pi_carrier_stack_fan_wall_fan*.stl`
- `dist/stl_artifacts/pi_cluster_stack/preview/`
  - `pi_carrier_stack_carrier_level_heatset.stl`
  - `pi_carrier_stack_carrier_level_printed.stl`
  - `pi_carrier_stack_preview.stl`

Generate the grouped artifacts after rendering STLs with:

```bash
python scripts/package_stl_artifacts.py --stl-dir stl --cad-dir cad --out-dir dist/stl_artifacts
```

This keeps the stack artifact aligned with the documented contents while leaving the carrier and
enclosure bundles unchanged.
