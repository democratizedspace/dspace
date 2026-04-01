# Cloudflare Load Balancing

This guide explains how to load balance multiple DSPACE instances using Cloudflare Tunnel and Cloudflare Load Balancing.

## Overview

Instead of running an Nginx reverse proxy, each DSPACE instance exposes port **3002** through its
own Cloudflare Tunnel. Cloudflare's load balancer distributes incoming traffic across these
tunnels, providing high availability without additional infrastructure.

## Steps

1. **Create a tunnel for each instance**
   ```bash
   cloudflared tunnel create dspace-1
   cloudflared tunnel route dns dspace-1 dspace.example.com
   ```
   Repeat for `dspace-2`, `dspace-3`, etc.

2. **Enable Cloudflare Load Balancing**
   - In the Cloudflare dashboard, open **Traffic → Load Balancing**.
   - Create a load balancer with your domain (e.g. `dspace.example.com`).
   - Add each tunnel as an origin. Cloudflare automatically health checks them.
   - Optionally configure session affinity or geographic routing.

3. **Update DNS**
   Cloudflare manages the DNS records automatically for each tunnel. Once the load balancer is
   active, users are directed to a healthy instance.

## Testing

After configuring the load balancer, verify that traffic fails over when an instance goes offline.

1. Stop one DSPACE node so its tunnel reports unhealthy.
2. Run:
   ```bash
   curl -I https://dspace.example.com
   ```
   The request should still return `200`, showing Cloudflare routed to a healthy node.
3. Start the stopped node and repeat to confirm it re-enters rotation.

## Related Guides

- [Raspberry Pi Deployment Guide](./RPI_DEPLOYMENT_GUIDE.md) – shows how to run DSPACE on a k3s
  cluster with Cloudflare Tunnel.
- [Monitoring Setup](./monitoring_setup.md) – add Prometheus and Grafana to watch the health of
  each instance.
