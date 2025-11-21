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
- [ ] Confirm chart appVersion and deployed image tag match the v3 release being merged:
  - [ ] Check chart metadata:
    ```bash
    yq '.appVersion' charts/dspace/Chart.yaml
    ```
  - [ ] Check the image tag in values for main:
    ```bash
    yq '.image.tag' charts/dspace/values.yaml
    ```
  - [ ] Ensure both values align with the image built for v3.
