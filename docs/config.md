# DSPACE v3 configuration guide

This document lists the runtime configuration expected by the DSPACE v3 container image and
Helm chart.

## Environment variables

| Name | Required | Description | Example | Source |
| ---- | -------- | ----------- | ------- | ------ |
| `PORT` | No | HTTP listen port. Defaults to `3000`. | `3000` | Helm `service.targetPort` |
| `HOST` | No | Interface to bind. Defaults to `0.0.0.0`. | `0.0.0.0` | Set automatically by chart |
| `LOG_LEVEL` | No | Structured log verbosity (`debug`, `info`, `warn`, `error`). | `info` | `values.yaml` |
| `VITE_TOKEN_PLACE_URL` | No | Optional upstream URL for Token Place integration. | `https://token-place.dev.sugarkube.cloud` | Config map/values |
| `FEATURE_FLAGS` | No | Comma separated feature toggles consumed by the frontend. | `enable-simulators` | Config map/values |
| `METRICS_TOKEN` | No | Bearer token required to access `/metrics` when set. | `***` | Kubernetes secret |

All variables can be provided via the chart (`values.yaml`) and are surfaced to the running
container as environment variables. Secrets should be mounted via Kubernetes `Secret`
objects and referenced under `env.secretRefs`.

## Secrets

The chart expects the following secret names (managed with SOPS) to exist in the target
namespace:

| Environment | Secret name | Purpose |
| ----------- | ----------- | ------- |
| `dev` | `dspace-dev-secrets` | Holds `METRICS_TOKEN` and any future API keys. |
| `int` | `dspace-int-secrets` | Holds `METRICS_TOKEN` and any future API keys. |
| `prod` | `dspace-prod-secrets` | Holds `METRICS_TOKEN` and any future API keys. |

## Storage

The application is stateless by default. A persistent volume claim can be enabled through
`values.yaml` if future features require shared state. When enabled, it defaults to
`ReadWriteOnce` with a 1 Gi capacity and will bind to the platform-provided storage class
(Longhorn by default on sugarkube clusters).

## Ports

* Container listens on TCP port `3000`.
* Kubernetes `Service` exposes TCP port `80` and forwards to container port `3000`.
* HTTP probes: `/healthz` (readiness) and `/livez` (liveness).
* Prometheus metrics are available at `/metrics` on the same service port and can be
  protected with the `METRICS_TOKEN` secret.
