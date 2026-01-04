# Operations Runbooks

Operational procedures now live in this directory. Start here when deploying, responding to
incidents, or performing maintenance.

## Contents

- [Accessibility walkthrough](./a11y-checklist.md)
- [Backup system](./backup_system.md)
- [Cloudflare load balancing](./cloudflare_load_balancing.md)
- [Deployments](./deploy/)
- [Failover procedures](./failover_procedures.md)
- [Monitoring setup](./monitoring_setup.md)
- [Netlify migration history](./netlify-migration.md)
- [Raspberry Pi deployment guide](./RPI_DEPLOYMENT_GUIDE.md)
- [Offline-first strategy](./offline-first.md)
- k3s + Sugarkube runbooks:
  - [Dev](../k3s-sugarkube-dev.md) (QA Cheats ON, port-forward by default)
  - [Staging](../k3s-sugarkube-staging.md) (QA Cheats ON, `env=staging`, staging host)
  - [Prod](../k3s-sugarkube-prod.md) (QA Cheats OFF, immutable tags only)
- Hardware notes:
  - [9-node Raspberry Pi topology](../raspi_cluster_topology_9_nodes.md)
  - [Power budget and load test](../power_budget_load_test.md)

Add new runbooks in this directory and update the list above.
