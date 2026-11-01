# Monitoring Setup

This guide explains how to run Prometheus and Grafana to monitor your self-hosted DSPACE instance.

## Prerequisites

- Docker and Docker Compose installed
- DSPACE running via `docker compose`

## Quick Start

1. From the repository root, run:

   ```bash
   cd infra/monitoring
   docker compose up -d
   ```

   This will start Prometheus on port **9090** and Grafana on **3001**.

2. Open `http://localhost:3001` in your browser and log in with the default credentials (`admin`/`admin`). You'll be prompted to change the password on first login.

3. Add Prometheus as a data source in Grafana using the URL `http://prometheus:9090`.

By default, Prometheus is configured to scrape the DSPACE metrics endpoint at
`http://host.docker.internal:8080/metrics`, matching the canonical runtime
service port. If you run DSPACE on a different port or host, update
`infra/monitoring/prometheus/prometheus.yml` accordingly.

You can now create dashboards to track container resource usage and the metrics
exposed by your DSPACE instance.

## Security Considerations

- The bundled `docker-compose.yml` binds Prometheus and Grafana to `127.0.0.1`
  so they are not reachable from other machines. If you need remote access,
  change the port mappings but ensure a firewall protects these services.
- Set custom Grafana credentials by exporting
  `GRAFANA_ADMIN_USER` and `GRAFANA_ADMIN_PASSWORD` before running
  `docker compose up`.
- The DSPACE metrics endpoint may expose operational details. Restrict access
  to trusted networks or add authentication if exposing it beyond localhost.

## Configuration

The `infra/monitoring/docker-compose.yml` file defines two services:

- **prometheus** – stores metrics using the configuration in `infra/monitoring/prometheus/prometheus.yml`.
- **grafana** – visualizes data from Prometheus and persists settings in the `grafana-data` volume.

Feel free to modify `infra/monitoring/prometheus/prometheus.yml` to scrape additional targets
such as node exporters or remote DSPACE instances.

## v3.1 chat metrics: optional proxy and visibility limits

The chat relay proxy is **optional and default-disabled**. Ordinary browser navigation does not
activate it. If an operator has not separately configured a trusted header-injection entry point,
leave the proxy disabled; do not infer that a deployment has this mechanism from these source docs.

All five configuration gates are required: `DSPACE_CHAT_PROXY_TOKEN`,
`DSPACE_CHAT_PROXY_RATE_LIMIT_REDIS_URL`, `DSPACE_CHAT_PROXY_RATE_LIMIT_REDIS_TOKEN`,
`DSPACE_CHAT_PROXY_PUBLIC_ACCESS=true`, and `DSPACE_CHAT_PROXY_AUTHORIZATION_TOKEN`.
Missing gates keep `tokenPlace.relayProxyAvailable` false in `/config.json`. Configuration alone
is not an authorized browser session: the trusted upstream must supply
`x-dspace-chat-proxy-authorization` on the SSR request before the server can mint an HttpOnly
session cookie. Never put the shared value in browser JavaScript, hydrated props, URLs, or query
parameters. This runbook does not authorize enabling the proxy or changing secrets.

**Browser-held OpenAI key traffic stays in the browser's direct provider path**, not the DSPACE
server proxy, and is intentionally **not observable in the server `/metrics` registry**. This means
DSPACE server metrics are not a count of all player chat activity. Do not forward browser keys to
DSPACE or accept browser-written metrics to fill that visibility gap. The server rejects
credential-bearing OpenAI proxy payloads and rejects `POST /metrics` with `405`. Separately
configured, authorized server-key OpenAI requests are a different path; they do not make local-key
traffic observable.

Token.place browser traffic also uses its direct relay path unless the proxy is available and
its session requirements are satisfied. With the proxy enabled, dependency counters describe
server-observed relay attempts. Correlated dChat `success` describes the stored dispatch outcome,
not proof of browser decryption or rendered output; a missing/expired completion produces no
correlated observation. Do not treat zero server traffic as proof of no chat usage or a success
counter as proof of a working end-to-end user flow.

See the [authorization and observability design](../design/observability-v3.1.md#chat-relay-proxy-authorization-model-and-observability-boundary)
and [v3.1 staging gates](../qa/v3.1.md#112a-chat-relay-proxy-required-configuration-gates).
Live header injection, secret non-exposure, Redis enforcement, browser rendering, and Prometheus
scraping still require separately recorded staging evidence. Source tests and this operator
runbook do not establish those deployment facts.
