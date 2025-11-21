# Deploying dspace v3 to k3s with sugarkube

This guide outlines how to deploy `dspace@v3` onto a k3s cluster using sugarkube. Traffic is
exposed to the internet via a Cloudflare Tunnel that forwards requests to Traefik, which is
bundled with k3s by default.

## Overview

1. k3s ships with Traefik enabled (its ingress class is `traefik`).
2. The `dspace` Helm chart is published as an OCI artifact to the GitHub Container Registry
   (GHCR) by the v3 CI pipeline.
3. sugarkube installs the chart and sets an ingress host such as `dspace-v3.<your-domain>`.
4. A Cloudflare Tunnel runs in-cluster and forwards internet traffic to the Traefik service.

## Prerequisites

- A k3s cluster with the default Traefik ingress controller enabled.
- A Cloudflare account with a managed DNS zone for your domain.
- Access to the GHCR images produced by the v3 CI pipeline.

## Quick local test without sugarkube

You can install the chart directly with Helm to verify connectivity before automating the
deployment with sugarkube. Replace `<your-domain>` with the DNS zone managed in Cloudflare:

```bash
helm upgrade --install dspace-v3 oci://ghcr.io/democratizedspace/charts/dspace \
  --namespace dspace --create-namespace \
  --set ingress.enabled=true \
  --set ingress.host=dspace-v3.<your-domain> \
  --set ingress.className=traefik
```

Traffic between cluster components uses Kubernetes service DNS names. For the dspace deployment,
the service DNS name will be `<release-name>.<namespace>.svc.cluster.local` (for example,
`dspace-v3.dspace.svc.cluster.local`).

## Deploying with sugarkube

Follow the [sugarkube dspace app guide][sugarkube-dspace-guide] for automated installs using the
latest onboarding steps. That guide covers:

- Installing the in-cluster Cloudflare Tunnel so external traffic reaches the Traefik service.
- Running a single `just` command to render and apply the sugarkube stack that deploys the
  `dspace` chart with the desired ingress host.

Refer to the upstream documentation for more details:

- [Helm OCI charts](https://helm.sh/docs/topics/registries/)
- [k3s Traefik ingress](https://docs.k3s.io/networking#traefik-ingress-controller)
- [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)

[sugarkube-dspace-guide]: https://github.com/futuroptimist/sugarkube/blob/main/docs/apps/dspace.md
