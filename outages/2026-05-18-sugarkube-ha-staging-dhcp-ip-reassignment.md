# Outage: Sugarkube HA staging DHCP IP reassignment and raw-IP cluster coupling

## Status / resolution

Resolved by rebuilding the disposable Sugarkube staging HA k3s cluster and restoring the
cluster add-ons needed for the DSPACE staging deployment. The DSPACE v3.0.1-rc.5 staging
release was successfully deployed after the cluster was rebuilt, Traefik was reinstalled,
and the Cloudflare tunnel path was restored.

Preventive work remains open. This record intentionally documents the outage and the
follow-up plan only; it does not implement recipe, cluster identity, tunnel, Helm helper,
or product-documentation changes.

## Summary

A brief home power outage occurred while the operator was away. After power and network
connectivity recovered, DHCP reassigned LAN addresses for the Raspberry Pi HA
control-plane nodes:

- `sugarkube3.local`
- `sugarkube4.local`
- `sugarkube5.local`

The reassignment exposed a Sugarkube defect: raw LAN IP addresses were baked into durable
k3s and cluster configuration instead of relying on stable `.local` node identities wherever
possible. For example, the installed k3s unit on `sugarkube3` contained a stale raw-IP TLS
SAN such as `--tls-san 192.168.86.37`, while the node later owned a different address such
as `192.168.86.40` on `eth0`.

The stale IP coupling made the three-server HA k3s control plane unhealthy. Helm and
`kubectl` could not reach a healthy Kubernetes API server, embedded etcd emitted repeated
raft and request-timeout errors, and the DSPACE v3.0.1-rc.5 staging deployment was blocked
until the cluster was rebuilt.

## Impact

- The three-server Sugarkube HA k3s staging cluster became unhealthy.
- The DSPACE v3.0.1-rc.5 staging deploy was initially blocked.
- k3s on `sugarkube3` was stuck in `activating (start)`.
- `kubectl` and Helm could not reach a healthy Kubernetes API server.
- Embedded etcd repeatedly logged errors including:
  - `transport: authentication handshake failed: context deadline exceeded`
  - `failed to publish local member to cluster through raft`
  - `etcdserver: request timed out`
- Because no Kubernetes cluster state needed preservation, the practical recovery path was
  a full HA cluster rebuild.

## Timeline

Exact wall-clock timestamps were not preserved in this outage record. The sequence below
uses approximate ordering from the operator's deployment and diagnostic journey.

1. **Initial DSPACE staging deploy failed at GHCR chart pull.**
   - Helm could not pull the DSPACE chart from GHCR.
   - The error included GHCR `403 denied: denied`.
   - The immediate cause was an expired GitHub classic PAT used for Sugarkube GHCR package
     read access. The PAT had `read:packages`, but it was expired.
   - The operator rotated the PAT and authenticated Helm to GHCR with the replacement
     credential:

     ```sh
     echo "$GHCR_PAT" | helm registry login ghcr.io -u "$GHCR_USER" --password-stdin
     ```

   - Chart access was verified with:

     ```sh
     helm show chart oci://ghcr.io/democratizedspace/charts/dspace --version 3.0.0
     ```

2. **After GHCR auth was fixed, Kubernetes was unreachable.**
   - The deploy then failed with:

     ```text
     Error: UPGRADE FAILED: Kubernetes cluster unreachable: the server is currently unable to handle the request
     ```

   - `kubectl cluster-info`, `kubectl get nodes`, and `kubectl get pods -A` returned
     `ServiceUnavailable` instead of a healthy API response.

3. **k3s diagnostics showed a stuck control plane.**
   - `systemctl status k3s` showed `Active: activating (start)`.
   - k3s logs repeatedly failed local embedded-etcd status checks.
   - etcd raft member publication timed out.
   - During shutdown, the node reported that it was not leader and identified another
     leader member ID.
   - Disk, memory, and load looked healthy, so resource pressure was not the likely cause.

4. **IP drift was discovered.**
   - The installed k3s unit contained a stale raw-IP TLS SAN such as
     `--tls-san 192.168.86.37`.
   - `hostname -I` and `ip addr` showed that the node now had different addresses,
     including `192.168.86.40` on `eth0`.
   - The cluster was intended to rely on stable `.local` identities, but the installed
     configuration still contained raw DHCP-assigned IPs.

5. **The operator chose a clean rebuild.**
   - No Kubernetes cluster state needed preservation.
   - The operator stopped k3s and ran `/usr/local/bin/k3s-uninstall.sh` on
     `sugarkube3`.
   - Recovery then proceeded as a full three-server HA rebuild, not a single-node repair,
     using:
     - `sugarkube3.local`
     - `sugarkube4.local`
     - `sugarkube5.local`
   - k3s needed to be uninstalled and rebuilt across all server nodes to avoid stale etcd
     membership.

6. **The rebuild exposed a separate named-environment parsing bug.**
   - Running `just up env=staging` caused Sugarkube to treat the literal environment name
     as `env=staging`.
   - This produced malformed discovery names and records such as:
     - `environment=env=staging`
     - `service_type=_k3s-sugar-env=staging._tcp`
     - `env=env=staging`
     - `/etc/avahi/services/k3s-sugar-env=staging.service`
   - The working command form used positional arguments:

     ```sh
     just up staging
     just save-logs staging
     ```

   - Stale malformed Avahi state had to be cleaned up:

     ```sh
     sudo rm -f /etc/avahi/services/k3s-sugar-env=staging.service
     sudo systemctl restart avahi-daemon
     ```

7. **The HA control plane was rebuilt successfully.**
   - `sugarkube3`, `sugarkube4`, and `sugarkube5` all reached `Ready`.
   - All three nodes reported `control-plane,etcd` roles.
   - Observed post-rebuild IPs included:
     - `sugarkube3`: `192.168.86.40`
     - `sugarkube4`: `192.168.86.35`
     - `sugarkube5`: `192.168.86.55`
   - The operator ran:

     ```sh
     just ha3-untaint-control-plane
     ```

   - This removed control-plane `NoSchedule` taints so workloads could run on the homelab
     control-plane nodes.

8. **Traefik needed restoration after the rebuild.**
   - `just cluster-status` showed no Traefik pods/services and no ingress classes.
   - `just traefik-crd-doctor` reported missing/healthy CRD state.
   - The operator reinstalled Traefik:

     ```sh
     just traefik-install
     ```

   - Traefik deployed successfully in `kube-system`.

9. **Cloudflare tunnel state needed restoration after the cluster wipe.**
   - The operator initially ran:

     ```sh
     just cf-tunnel-install env=staging token="$CF_TUNNEL_TOKEN" # scan-secrets: ignore - placeholder only
     ```

   - This exposed the same named-environment parsing class of bug. The tunnel name became
     `sugarkube-env=staging`.
   - Until the recipe bug is fixed, the intended command form is positional:

     ```sh
     just cf-tunnel-install staging token="$CF_TUNNEL_TOKEN" # scan-secrets: ignore - placeholder only
     ```

10. **The fresh cluster needed Helm install semantics, not upgrade-only semantics.**
    - Running `just helm-oci-upgrade ...` on the wiped cluster failed with:

      ```text
      UPGRADE FAILED: "dspace" has no deployed releases
      ```

    - The correct fresh-cluster path was `just helm-oci-install ...`.
    - Future updates after the release exists can use `just helm-oci-upgrade ...`.

11. **DSPACE staging was restored.**
    - The DSPACE v3.0.1-rc.5 staging deploy succeeded.
    - Browser verification showed `staging.democratized.space` online.
    - The bottom-left app build badge matched the deployed SHA/tag, for example
      `main-92a1bcb`.
    - The production apex domain intentionally remained on v3.0.0.

## Detection

The outage was detected during a DSPACE v3.0.1-rc.5 staging deployment. GHCR
authentication failed first, but after that credential issue was resolved, Helm reported the
Kubernetes API as unreachable and `kubectl` commands returned `ServiceUnavailable`. k3s and
etcd diagnostics then revealed the stuck control plane and raft timeouts.

The key diagnostic pivot was comparing durable k3s configuration against the current node
network state. The k3s unit still referenced a stale raw IP, while `hostname -I` and
`ip addr` showed the node now had a different DHCP-assigned address.

## Root cause

DHCP reassigned the LAN IPs for the Raspberry Pi HA control-plane nodes after a brief home
power outage and network recovery. That reassignment exposed Sugarkube raw-IP coupling:
durable k3s/cluster configuration included DHCP-assigned LAN IP addresses rather than using
stable `.local` identities wherever possible.

The stale raw IPs made the HA control plane fragile across DHCP reassignment. In the
observed case, `sugarkube3` had a stale TLS SAN such as `--tls-san 192.168.86.37` after it
later owned `192.168.86.40`, contributing to an unhealthy k3s/etcd control plane.

## Contributing factors

- The home network used DHCP-assigned LAN addresses for the Raspberry Pi nodes.
- The outage occurred while the operator was away, delaying immediate observation.
- Sugarkube intended to use stable `.local` identities, but durable installed config still
  retained raw IPs.
- The initial expired GHCR PAT produced a separate `403 denied: denied` failure that had to
  be resolved before the Kubernetes reachability failure was visible.
- The `just up env=staging` and `just cf-tunnel-install env=staging ...` command forms were
  parsed as literal environment values, creating malformed names and avoidable cleanup work.
- A fresh cluster had no deployed `dspace` Helm release, so the upgrade-only helper failed
  instead of guiding the operator toward install semantics.

## What went well

- GHCR authentication was isolated and corrected by rotating the expired classic PAT and
  verifying chart access with `helm show chart`.
- k3s diagnostics narrowed the issue to control-plane health rather than DSPACE application
  code.
- Disk, memory, and load checks helped rule out obvious resource pressure.
- Because no Kubernetes state needed preservation, the operator could choose a clean rebuild
  instead of risky etcd member surgery.
- The full HA rebuild restored all three control-plane/etcd nodes to `Ready`.
- Traefik and Cloudflare tunnel restoration steps were identified quickly after the wipe.
- Final browser verification confirmed that staging was online on the intended DSPACE build.

## What went poorly

- Durable cluster configuration depended on raw DHCP IPs even though the operational intent
  was stable `.local` node identity.
- k3s/etcd failed in a way that made the Kubernetes API unavailable to both `kubectl` and
  Helm.
- The named-environment `just` forms produced malformed Avahi and tunnel names instead of
  behaving like the positional staging commands.
- The Helm OCI upgrade helper did not gracefully handle a fresh cluster with no deployed
  release.
- The incident traversed several independent issues, making the first visible failure
  (GHCR auth) different from the deeper cluster-health failure.

## Recovery steps taken

Immediate remediation focused on restoring staging, not implementing permanent prevention:

1. Rotated the expired GitHub classic PAT used for Sugarkube GHCR package reads.
2. Logged Helm into GHCR with the replacement credential and verified chart access.
3. Confirmed `kubectl` and Helm could not reach a healthy Kubernetes API server.
4. Inspected k3s service state and logs, including embedded-etcd errors.
5. Compared k3s durable configuration against the node's current network addresses.
6. Chose a clean rebuild because no cluster state needed preservation.
7. Stopped and uninstalled k3s, then rebuilt the full three-server HA cluster across
   `sugarkube3.local`, `sugarkube4.local`, and `sugarkube5.local`.
8. Avoided the malformed named-environment `just up env=staging` form and used
   `just up staging`.
9. Removed stale malformed Avahi service files and restarted Avahi.
10. Removed control-plane `NoSchedule` taints with `just ha3-untaint-control-plane`.
11. Reinstalled Traefik with `just traefik-install`.
12. Restored the Cloudflare tunnel path, using positional staging syntax as the intended
    command form until the recipe bug is fixed.
13. Used `just helm-oci-install ...` for the fresh-cluster DSPACE deployment.
14. Verified the DSPACE v3.0.1-rc.5 staging site in a browser.

## Verification

Recovery was considered complete when the following checks were true:

- All three HA server nodes were `Ready`.
- `sugarkube3`, `sugarkube4`, and `sugarkube5` all had `control-plane,etcd` roles.
- Workload scheduling on the homelab control-plane nodes was enabled after taint removal.
- Traefik was deployed successfully in `kube-system`.
- The Cloudflare tunnel route for staging was restored.
- `just helm-oci-install ...` completed successfully for the fresh-cluster DSPACE release.
- `staging.democratized.space` loaded in a browser.
- The app build badge matched the deployed staging SHA/tag, for example `main-92a1bcb`.
- Production/apex remained intentionally unchanged on v3.0.0.

## Follow-up actions

These are prevention or usability improvements and were not implemented in this outage
record:

- Fix `just up env=staging` parity so it behaves like `just up staging` instead of treating
  `env=staging` as the literal environment name.
- Remove avoidable raw DHCP IP coupling from durable k3s configuration; prefer stable
  `.local` identities wherever k3s and supporting cluster components allow it.
- Fix `just cf-tunnel-install env=staging ...` parity and tunnel naming so it does not
  create names such as `sugarkube-env=staging`.
- Improve Helm OCI helper UX for fresh clusters where upgrade-only semantics fail because no
  release has been deployed yet.
- Add DSPACE-facing documentation discoverability from:
  - `docs/k3s-sugarkube-staging.md`
  - `docs/k3s-sugarkube-prod.md`
  - `docs/k3s-sugarkube-dev.md`
- Add Sugarkube setup, operations, and troubleshooting documentation discoverability from:
  - `docs/raspi_cluster_setup.md`
  - relevant operations and troubleshooting docs.
- Document the recommended DHCP, mDNS, TLS SAN, etcd membership, Traefik, Cloudflare tunnel,
  and Helm install-vs-upgrade recovery checks for future homelab staging incidents.

## Related planned prompts/tasks

0. Add this outage record documenting the incident, root cause, recovery path, and follow-up
   plan.
1. Fix `just up env=staging` parity with `just up staging`.
2. Make Sugarkube resilient to DHCP IP reassignment by eliminating avoidable raw-IP coupling
   and preferring stable `.local` identities.
3. Fix `just cf-tunnel-install env=staging ...` parity and tunnel naming.
4. Improve fresh-cluster Helm OCI behavior when `helm-oci-upgrade` has no deployed release.
5. In `democratizedspace/dspace`, document DSPACE-facing recovery and failure guidance.
6. In `futuroptimist/sugarkube`, document Sugarkube setup, operations, and troubleshooting
   guidance linked to this outage.

## Security notes

- No real PAT, Cloudflare token, kubeconfig, or other secret value is included in this
  record.
- Commands use environment variable placeholders such as `$GHCR_PAT`, `$GHCR_USER`, and
  `$CF_TUNNEL_TOKEN` only to show safe operator command shape.
- The GHCR credential issue is documented only as an expired classic PAT with
  `read:packages`; the value itself is intentionally omitted.
