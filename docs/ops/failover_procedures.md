# Failover Procedures

This guide outlines how to handle downtime when running multiple DSPACE instances behind Cloudflare Load Balancing.

## Overview

If an instance becomes unreachable, Cloudflare automatically routes traffic to a healthy node.
However, you should still investigate the failed instance and restore it promptly.

## Steps

1. **Confirm the outage**
   - Visit your Cloudflare dashboard and check the Load Balancing pool health.
   - You can also open `/health` on each instance directly.

2. **Restart the container**
   - SSH into the affected host and run:
     ```bash
     docker compose restart app
     ```
   - Wait a few seconds, then verify that `curl http://localhost:3002/health` returns `{ "status": "ok" }`.

3. **Check Prometheus metrics**
   - Navigate to your Grafana dashboard (default `http://localhost:3001`) and confirm the
     `up` metric shows `1` for all instances.

4. **Fallback option**
   - If a node becomes corrupted or unreachable, redeploy DSPACE through the canonical Sugarkube
     Helm flow using the [DSPACE Sugarkube release runbook](./sugarkube-release.md) and the
     [Sugarkube DSPACE app runbook](https://github.com/futuroptimist/sugarkube/blob/main/docs/apps/dspace.md).
   - Once the replacement instance is running, add it to your [Cloudflare load balancer](./cloudflare_load_balancing.md)
     as an origin.

Cloudflare automatically returns the restored instance to rotation once it reports as healthy.
