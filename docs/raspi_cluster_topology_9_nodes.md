# Raspberry Pi cluster topology (9 nodes)

This layout describes the sugarkube-aligned Raspberry Pi cluster when expanded beyond the default
three-node HA control plane. It assumes Raspberry Pi 5 (or similar) hardware, PoE+ hats, and
Traefik as the ingress controller.

## Node roles and addressing

- **Control plane (3x):** `sugarkube0-2` – k3s server nodes, etcd members, run Traefik and core
  system add-ons.
- **Application pool (4x):** `sugarkube3-6` – general-purpose worker nodes for dspace workloads and
  supporting services (e.g., monitoring).
- **Utility pool (2x):** `sugarkube7-8` – reserved for build agents, test harnesses, or temporary
  staging rollouts.
- Suggested VLAN/IP range: dedicate a management VLAN for k3s control traffic and keep pod/service
  networks on their own CIDRs to simplify debugging and packet captures.

## Topology notes

- Spread the control plane nodes across different power circuits and switches when possible.
- Keep at least one application node in a separate switch stack to validate failover paths.
- Label switch ports with node names and PoE budgets; keep the mapping in version control for
  audits.

## Mitigation tips

- Reserve headroom: target <70% aggregate CPU and <75% memory utilization on the application pool so
  a single-node failure does not exhaust the remaining workers.
- Use topology-aware spreading rules in k3s/Helm (anti-affinity by hostname or topology keys) to
  avoid co-locating replicas on the same switch or PSU.
- Run periodic failover drills: power down one control plane node and one application node to
  confirm etcd quorum and Traefik ingress continue serving traffic.
- Record the node inventory and roles in your sugarkube secrets/vars so new operators can
  reconstruct the wiring without guessing.
