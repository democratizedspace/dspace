# Failover Procedures

This guide outlines how to handle downtime when running multiple DSPACE instances with Cloudflare Load Balancing.

## Overview

If an instance becomes unreachable, Cloudflare automatically routes traffic to a healthy node.
However, you should still investigate the failed instance and restore it as soon as possible.

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
    - Navigate to your Grafana dashboard (default `http://localhost:3001`) and ensure the
      `up` metric shows `1` for all instances.

4. **Fallback option**
    - If a node is corrupted or unreachable, spin up a new instance using the deployment steps from the
      [Raspberry Pi Deployment Guide](./RPI_DEPLOYMENT_GUIDE.md).
    - Once the new node is running, add it to your [Cloudflare load balancer](./cloudflare_load_balancing.md)
      as an origin.

Cloudflare automatically returns the restored instance to rotation once it reports as healthy.

