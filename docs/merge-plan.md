# v3 → main merge checklist

Use this list to confirm everything is ready before merging v3 into main.

- [ ] CI green for the release pipeline (image build and Helm chart publish jobs succeeded).
- [ ] Record the install command used for the release and capture the final Cloudflare URL.
- [ ] Document the Helm values diff between dev and main namespaces:
  - [ ] Export both value sets and compare.
  - [ ] Note any deviations that will ship to main.
  - Shell snippet:
    ```bash
    helm get values dspace -n <MAIN_NAMESPACE> --all > /tmp/values-main.yaml
    helm get values dspace -n <DEV_NAMESPACE> --all > /tmp/values-dev.yaml
    diff -u /tmp/values-dev.yaml /tmp/values-main.yaml
    ```
- [ ] Verify rollback plan:
  - [ ] Confirm `helm rollback dspace <REV>` works for the release namespace.
  - [ ] Document how to switch images if needed:
    ```bash
    helm upgrade dspace charts/dspace \
      -n <NAMESPACE> \
      --reuse-values \
      --set image.tag=<PREVIOUS_TAG>
    ```
- Chart appVersion and the default image tag are pinned to the current release (v3.0.0) and
  enforced by automated tests. To verify any overridden deployment values, run:
  ```bash
  yq '.appVersion' charts/dspace/Chart.yaml
  yq '.image.tag' charts/dspace/values.yaml
  ```
