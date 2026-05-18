# Sugarkube HA staging outage after DHCP IP reassignment

## Status / Resolution

Resolved. The affected three-server Sugarkube HA staging cluster was rebuilt because no
Kubernetes cluster state needed preservation. After the rebuild, the DSPACE v3.0.1-rc.5 staging
deploy succeeded, `staging.democratized.space` loaded in a browser, and the app build badge
matched the deployed release/SHA such as `main-92a1bcb`. The production/apex domain intentionally
remained on v3.0.0.

This record documents the incident and recovery path only. It does not implement the follow-up
Sugarkube fixes that will make future clusters resilient to DHCP IP drift.

## Summary

A brief home power outage occurred while the operator was away. After the network recovered, DHCP
reassigned LAN IPs for the Raspberry Pi HA control-plane nodes:

- `sugarkube3.local`
- `sugarkube4.local`
- `sugarkube5.local`

The reassignment exposed a Sugarkube bug: raw LAN IP addresses were baked into durable k3s/cluster
configuration instead of consistently using the intended stable `.local` node identities wherever
possible. For example, the installed k3s unit on `sugarkube3` included a stale raw IP TLS SAN such
as `--tls-san 192.168.86.37`, while the node later owned a different address such as
`192.168.86.40`.

The stale raw-IP coupling left the HA k3s control plane unhealthy. `kubectl` and Helm could not
reach a healthy Kubernetes API server, embedded etcd repeatedly timed out during raft publication,
and the DSPACE v3.0.1-rc.5 staging deployment was blocked until the cluster was rebuilt.

## Impact

- The three-server HA k3s staging cluster became unhealthy.
- The DSPACE v3.0.1-rc.5 staging deploy was initially blocked.
- k3s on `sugarkube3` became stuck in `activating (start)`.
- `kubectl` and Helm could not reach a healthy Kubernetes API server.
- Embedded etcd emitted repeated errors, including:
  - `transport: authentication handshake failed: context deadline exceeded`
  - `failed to publish local member to cluster through raft`
  - `etcdserver: request timed out`
- The cluster had to be rebuilt because no Kubernetes cluster state needed preservation.

## Timeline

Exact timestamps were not preserved in this outage record; the order below follows the operator's
incident journey.

1. A DSPACE staging deploy attempt initially failed while pulling the Helm chart from GHCR. The
   error included GHCR `403 denied: denied`.
2. The GHCR failure was traced to an expired GitHub classic PAT used for Sugarkube GHCR package
   read access. The token had `read:packages`, but it had expired.
3. The operator rotated the PAT and logged Helm into GHCR successfully:

   ```bash
   echo "$GHCR_PAT" | helm registry login ghcr.io -u "$GHCR_USER" --password-stdin
   ```

4. GHCR chart access was verified successfully:

   ```bash
   helm show chart oci://ghcr.io/democratizedspace/charts/dspace --version 3.0.0
   ```

5. After GHCR auth was fixed, the deploy failed because Kubernetes was unreachable:

   ```text
   Error: UPGRADE FAILED: Kubernetes cluster unreachable: the server is currently unable to handle the request
   ```

6. `kubectl cluster-info`, `kubectl get nodes`, and `kubectl get pods -A` returned
   `ServiceUnavailable`.
7. k3s diagnostics showed the control plane was stuck. `systemctl status k3s` showed
   `Active: activating (start)`, k3s repeatedly failed to test local etcd status, and etcd raft
   publication timed out.
8. The node was not leader and reported another leader member ID during shutdown. Disk, memory,
   and load looked healthy, so resource pressure was not the likely cause.
9. IP drift was discovered. The k3s unit included `--tls-san 192.168.86.37`, while
   `hostname -I` / `ip addr` showed the node now had different addresses, including
   `192.168.86.40` on `eth0`.
10. The operator chose a clean rebuild because no Kubernetes state needed preservation. k3s was
    stopped and `/usr/local/bin/k3s-uninstall.sh` was run on `sugarkube3`.
11. The recovery was treated as a full three-server HA rebuild, not a single-node repair. k3s had
    to be uninstalled/rebuilt across all server nodes to avoid stale etcd membership:
    - `sugarkube3.local`
    - `sugarkube4.local`
    - `sugarkube5.local`
12. During rebuild, a separate Sugarkube recipe bug was exposed. Running `just up env=staging`
    caused Sugarkube to treat the literal environment as `env=staging`.
13. The named-env parsing bug produced malformed discovery names and records such as:
    - `environment=env=staging`
    - `service_type=_k3s-sugar-env=staging._tcp`
    - `env=env=staging`
    - `/etc/avahi/services/k3s-sugar-env=staging.service`
14. The immediate workaround was to use positional arguments:

    ```bash
    just up staging
    just save-logs staging
    ```

15. Stale malformed Avahi files were cleaned up and Avahi was restarted:

    ```bash
    sudo rm -f /etc/avahi/services/k3s-sugar-env=staging.service
    sudo systemctl restart avahi-daemon
    ```

16. The HA cluster was successfully rebuilt. `sugarkube3`, `sugarkube4`, and `sugarkube5` all
    reached `Ready`, and all were `control-plane,etcd`.
17. Observed IPs after rebuild included:
    - `sugarkube3`: `192.168.86.40`
    - `sugarkube4`: `192.168.86.35`
    - `sugarkube5`: `192.168.86.55`
18. The operator removed control-plane `NoSchedule` taints so workloads could run on the homelab
    control-plane nodes:

    ```bash
    just ha3-untaint-control-plane
    ```

19. Traefik needed attention after the rebuild. `just cluster-status` showed no Traefik pods,
    services, or ingress classes. `just traefik-crd-doctor` reported missing/healthy CRD state.
20. Traefik was reinstalled successfully in `kube-system`:

    ```bash
    just traefik-install
    ```

21. The Cloudflare tunnel also needed reinstall after the cluster wipe. The operator initially ran
    the named-env form:

    ```bash
    just cf-tunnel-install env=staging <token argument from CF_TUNNEL_TOKEN>
    ```

22. That exposed the same named-env parsing bug: the tunnel name became `sugarkube-env=staging`.
    Until fixed, the intended workaround is the positional environment form:

    ```bash
    just cf-tunnel-install staging <token argument from CF_TUNNEL_TOKEN>
    ```

23. On the fresh cluster, DSPACE deploy required install rather than upgrade. Running
    `just helm-oci-upgrade ...` failed with:

    ```text
    UPGRADE FAILED: "dspace" has no deployed releases
    ```

24. The correct fresh-cluster path was `just helm-oci-install ...`. Future updates after the
    release exists can use `just helm-oci-upgrade ...`.
25. The DSPACE v3.0.1-rc.5 staging deploy succeeded. Browser verification showed
    `staging.democratized.space` online, with the bottom-left app build badge matching the deployed
    SHA/tag such as `main-92a1bcb`.

## Detection

The incident was detected during the DSPACE v3.0.1-rc.5 staging deployment. The first visible
failure was GHCR chart access returning `403 denied: denied`. After the expired PAT was rotated and
GHCR chart access was verified, the deployment remained blocked by Kubernetes API unavailability:

- Helm reported `Kubernetes cluster unreachable`.
- `kubectl cluster-info`, `kubectl get nodes`, and `kubectl get pods -A` returned
  `ServiceUnavailable`.
- `systemctl status k3s` showed k3s stuck in `activating (start)`.
- k3s/etcd logs repeatedly timed out while testing local etcd status and publishing the local etcd
  member through raft.

## Root cause

A brief home power outage caused the LAN to recover with different DHCP assignments for the
Sugarkube HA control-plane Raspberry Pis. That network change exposed a Sugarkube durability bug:
raw DHCP LAN IP addresses had been written into durable k3s/cluster configuration, including k3s
TLS SAN arguments, instead of using stable `.local` node identities wherever possible.

The cluster was intended to rely on identities such as `sugarkube3.local`, `sugarkube4.local`, and
`sugarkube5.local`. However, the installed configuration still contained raw IPs. Once DHCP moved a
node from an old address such as `192.168.86.37` to a new address such as `192.168.86.40`, the
stored cluster assumptions no longer matched the live network. The mismatch contributed to k3s
startup failure, Kubernetes API unavailability, and repeated embedded etcd raft/handshake timeouts.

## Contributing factors

- The staging cluster used DHCP-assigned LAN IPs without sufficient protection against IP drift.
- Sugarkube's installed k3s configuration retained raw IP values in durable control-plane settings.
- The cluster was a three-server embedded-etcd HA setup, so stale member assumptions affected
  control-plane recovery.
- The initial GHCR PAT expiry created a separate first failure that had to be cleared before the
  underlying Kubernetes unavailability was visible.
- `just up env=staging` and `just cf-tunnel-install env=staging ...` accepted a named environment
  argument syntactically but treated the literal value as the environment name, producing malformed
  service discovery and tunnel naming.
- The wiped cluster no longer had a deployed Helm release, so upgrade-only DSPACE deploy helpers
  failed until the install path was used.

## What went well

- GHCR authentication was quickly isolated to an expired classic PAT and fixed by rotating the PAT.
- Helm chart access was verified directly with `helm show chart` before continuing.
- k3s diagnostics ruled out obvious disk, memory, and load pressure.
- The operator identified raw-IP drift by comparing the k3s unit TLS SAN with `hostname -I` /
  `ip addr` output.
- Because no cluster state needed preservation, a clean rebuild was safe and reduced recovery risk.
- The operator rebuilt the intended three-server HA topology rather than accidentally restoring a
  single-node cluster.
- The final browser check verified both service availability and the deployed DSPACE build badge.

## What went poorly

- Durable cluster configuration contained raw DHCP IP addresses despite the intended stable
  `.local` identity model.
- The HA control plane did not recover automatically after DHCP IP reassignment.
- The named-env Just recipe form produced malformed Avahi and tunnel names instead of behaving like
  the positional form or failing fast.
- The recovery required manual Traefik and Cloudflare tunnel restoration after the cluster wipe.
- The Helm OCI upgrade helper produced an expected-but-confusing failure on a fresh cluster with no
  deployed release.

## Recovery steps taken

Immediate remediation focused on restoring staging, not preventing recurrence:

1. Rotated the expired GitHub classic PAT used for GHCR package reads. No token value is recorded in
   this outage entry.
2. Logged Helm into GHCR using standard input for the password and verified chart access.
3. Confirmed Kubernetes API unavailability with Helm and `kubectl`.
4. Inspected `systemctl status k3s` and k3s/etcd logs.
5. Identified IP drift by comparing the stale k3s TLS SAN with current interface addresses.
6. Chose a clean rebuild because no Kubernetes state needed preservation.
7. Stopped/uninstalled k3s and rebuilt the full three-server HA control plane across
   `sugarkube3.local`, `sugarkube4.local`, and `sugarkube5.local`.
8. Avoided the broken named-env `just up env=staging` form and used `just up staging` /
   `just save-logs staging` instead.
9. Removed malformed Avahi service files created during the named-env attempt and restarted Avahi.
10. Confirmed all three server nodes reached `Ready` as `control-plane,etcd`.
11. Ran `just ha3-untaint-control-plane` so staging workloads could schedule on the homelab
    control-plane nodes.
12. Reinstalled Traefik with `just traefik-install` after confirming it was absent.
13. Reinstalled the Cloudflare tunnel, using the positional environment command as the intended
    workaround until named-env parsing is fixed.
14. Used `just helm-oci-install ...` for the first DSPACE deploy on the wiped cluster, reserving
    `just helm-oci-upgrade ...` for future updates after the release exists.

## Verification

- `helm show chart oci://ghcr.io/democratizedspace/charts/dspace --version 3.0.0` succeeded after
  GHCR PAT rotation and Helm registry login.
- The rebuilt cluster reported `sugarkube3`, `sugarkube4`, and `sugarkube5` as `Ready` with
  `control-plane,etcd` roles.
- Current observed post-rebuild node IPs included `192.168.86.40`, `192.168.86.35`, and
  `192.168.86.55` for `sugarkube3`, `sugarkube4`, and `sugarkube5`, respectively.
- Traefik deployed successfully in `kube-system` after `just traefik-install`.
- The DSPACE v3.0.1-rc.5 staging deploy succeeded on the rebuilt cluster.
- Browser verification showed `staging.democratized.space` online and the app build badge matching
  the deployed SHA/tag such as `main-92a1bcb`.
- The production/apex domain intentionally remained on v3.0.0.

## Follow-up actions

Planned prevention and UX work is intentionally deferred to later tasks:

- Fix `just up env=staging` parity so it behaves like `just up staging`, or fails clearly instead
  of treating `env=staging` as a literal environment name.
- Remove avoidable raw DHCP IP coupling from durable k3s config; use `.local` identities wherever
  possible.
- Fix `just cf-tunnel-install env=staging ...` parity and tunnel naming so it does not create names
  such as `sugarkube-env=staging`.
- Improve Helm OCI helper UX for fresh clusters where upgrade-only fails because no deployed release
  exists.
- Add DSPACE docs discoverability from:
  - `docs/k3s-sugarkube-staging.md`
  - `docs/k3s-sugarkube-prod.md`
  - `docs/k3s-sugarkube-dev.md`
- Add Sugarkube docs discoverability from:
  - `docs/raspi_cluster_setup.md`
  - relevant operations/troubleshooting docs.

## Related planned prompts/tasks

- Task 1: Fix `just up env=staging` parity with `just up staging`.
- Task 2: Make Sugarkube resilient to DHCP IP reassignment by eliminating avoidable raw-IP coupling
  and preferring stable `.local` identities.
- Task 3: Fix `just cf-tunnel-install env=staging ...` parity and tunnel naming.
- Task 4: Improve fresh-cluster Helm OCI behavior when `helm-oci-upgrade` has no deployed release.
- Task 5: In `democratizedspace/dspace`, document DSPACE-facing recovery/failure guidance.
- Task 6: In `futuroptimist/sugarkube`, document Sugarkube setup/ops/troubleshooting guidance
  linked to this outage.

## Sensitive data handling

This entry intentionally records only environment-variable placeholders and command shapes. It does
not include real GitHub PATs, Cloudflare tunnel tokens, kubeconfig values, or other secrets.
