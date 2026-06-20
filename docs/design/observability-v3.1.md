# DSPACE v3.1.0 observability release design

This document makes observability an explicit DSPACE v3.1.0 release requirement. It is release-planning documentation only: do not implement new metrics, dashboards, alerts, exporters, ServiceMonitors, NetworkPolicies, Helm resources, package versions, chart versions, or image tags in this slice.

## Source-of-truth inputs

- Sugarkube's canonical observability design is the upstream platform contract for DSPACE, token.place, and danielsmith.io. DSPACE owns app metrics, bounded labels, health endpoints, release identity, chart scrape hooks, app runbooks, and privacy guarantees; Sugarkube owns Prometheus, Grafana, Alertmanager, blackbox exporter, cluster resource metrics, discovery policy, shared dashboards, and alert routing.
- The active repository version metadata still says `3.0.1` in `package.json` and `charts/dspace/Chart.yaml`. Forward-looking DSPACE v3.1.0 QA and roadmap text is therefore planning status until a candidate SHA/tag, staging evidence, and release approval are attached.
- `charts/dspace/` is the only in-repository Helm chart and is the canonical chart for the current GHCR/Sugarkube release path because `.github/workflows/ci-helm.yml` packages `charts/dspace` and pushes it to `oci://ghcr.io/democratizedspace/charts/dspace:<chart-version>`. There are no other DSPACE Helm chart trees in this repository; local monitoring files under `infra/monitoring/` are a Docker Compose scaffold, not a release chart.

## Current-state inventory

| Area                                | Status                                 | Evidence and release implication                                                                                                                                                                                                                                                                                                                                       |
| ----------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| App `/metrics` route                | Partial                                | `frontend/src/pages/metrics.ts` serves Prometheus text and supports `METRICS_TOKEN` bearer auth when set. The route currently exposes only the shared registry output. v3.1.0 must prove this route is reachable from staging and production Prometheus, not publicly privileged.                                                                                      |
| Runtime default/process metrics     | Partial                                | `frontend/src/utils/metrics.js` initializes `prom-client` default metrics when available and falls back to `# metrics unavailable`. This covers process/runtime health only when `prom-client` is installed and loaded successfully.                                                                                                                                   |
| Dedicated metrics listener          | Partial / privileged until constrained | `infra/metrics.mjs` can expose `prom-client` default metrics on port `9464` when `DSPACE_ENABLE_METRICS=1`, but it has no bearer-token enforcement. It must not be treated as safe for public exposure unless protected by cluster-only networking or changed in a later implementation PR.                                                                            |
| HTTP request metrics                | Missing                                | Existing dashboards and alerts reference `http_requests_total` and `http_request_duration_seconds_bucket`, but no repository evidence shows these families are emitted by the app. v3.1.0 must either implement and verify them in a separate runtime PR before release or keep promotion blocked.                                                                     |
| dChat metrics                       | Missing                                | No app metric family currently counts dChat requests or latency by bounded provider/outcome categories.                                                                                                                                                                                                                                                                |
| token.place dependency metrics      | Missing                                | No app metric family currently separates token.place successes, timeouts, rate limits, malformed responses, or server failures.                                                                                                                                                                                                                                        |
| Provider selection/fallback metrics | Missing                                | No server-side metric currently records provider-selection failures or measurable fallback behavior. Browser-only provider debug state is not an acceptable substitute.                                                                                                                                                                                                |
| Deployment/release identity metric  | Missing / partial config               | The chart injects `DSPACE_VERSION` and `DSPACE_ENV`, and the Docker build can stamp a SHA into frontend metadata. A bounded `dspace_build_info`-style metric still needs release-gating verification.                                                                                                                                                                  |
| Local Prometheus/Grafana scaffold   | Legacy / local-only                    | `infra/monitoring/` starts local Prometheus and Grafana and includes starter dashboard/alerts. It is useful for development but is not Sugarkube staging/production evidence. Its alert runbook links point at `monitoring/README.md` rather than the current `infra/monitoring/README.md`.                                                                            |
| Helm scrape configuration           | Missing in canonical chart             | `charts/dspace/` currently has Deployment, Service, Ingress, Secret, ConfigMap, and ServiceAccount templates only. It does not render a ServiceMonitor, metrics Service port, NetworkPolicy, or equivalent scrape discovery. v3.1.0 must identify `charts/dspace/` as canonical and block release until the canonical scrape hook exists and is discovered in staging. |
| Duplicate/legacy chart trees        | Not present                            | No duplicate DSPACE chart tree was found in this repository. Do not update non-chart monitoring scaffolds as if they were Helm release resources.                                                                                                                                                                                                                      |

## v3.1.0 requirements by classification

### v3.1.0 release blockers

- [ ] A Prometheus-compatible endpoint exists in staging and production and is reachable by in-cluster Prometheus.
- [ ] The canonical scrape configuration is in `charts/dspace/`, or an explicitly documented temporary Sugarkube-owned static scrape config is attached with a post-v3.1 follow-up to move discovery into the app chart.
- [ ] Scrape discovery uses ServiceMonitor or an equivalent explicit discovery mechanism compatible with Sugarkube's kube-prometheus-stack convention, including `release: kube-prometheus-stack` unless Sugarkube intentionally changes selectors before this release.
- [ ] Metrics access allows in-cluster scraping without exposing a privileged metrics surface publicly. Acceptable evidence is one of:
  - `/metrics` protected by `METRICS_TOKEN` and Prometheus configured with the matching bearer token;
  - a cluster-only metrics Service/port reachable only from the monitoring namespace;
  - an equivalent NetworkPolicy/ingress design approved in release notes.
- [ ] Release/build identity is attached with bounded labels such as `service="dspace"`, `environment`, `version`, `git_sha`, and immutable image tag/digest. Do not add request, user, model, or error text labels.
- [ ] HTTP request totals and latency histograms exist with bounded route groups and status classes, not raw URLs or full status-code/user dimensions.
- [ ] Process/runtime health metrics are present and queryable.
- [ ] dChat request totals and latency exist by bounded provider and outcome categories. Providers should be low-cardinality values such as `token_place` and `openai`; outcomes should be low-cardinality values such as `success`, `timeout`, `rate_limited`, `provider_error`, `malformed_response`, `client_error`, and `configuration_error`.
- [ ] token.place dependency metrics distinguish successes, timeouts, rate limits, malformed responses, and upstream/server failures.
- [ ] Provider-selection failures and fallback behavior are measured where they happen on the server. Browser-only debug panels may aid QA but do not satisfy this release gate.
- [ ] A DSPACE dashboard exists in staging and covers availability/request rate, latency percentiles, status/error ratio, dChat traffic/outcomes, token.place dependency health, pod readiness/restarts/resources, and deployed release identity.
- [ ] Release-gating alerts exist in staging for application unavailable, sustained HTTP 5xx ratio, latency regression, token.place dependency failure ratio, dChat timeout or rate-limit spike, and repeated pod restarts.
- [ ] Alert thresholds are provisional and documented as staging-derived before production promotion; do not invent historical production baselines.
- [ ] Privacy review confirms metrics and labels never include prompts, responses, OpenAI keys, token.place credentials, save data, inventory, player identity, IP addresses, arbitrary URLs, request IDs, or exception text as labels.
- [ ] Safe operational metrics are explicitly separated from browser-only debugging information; browser debug payloads are not scraped, logged, or exported as operational metrics.
- [ ] Rollback instructions use the prior immutable DSPACE image tag/digest and prior chart values. Operators must be able to restore the prior image without rebuilding.

### Required staging evidence

- [ ] Prometheus target discovery shows the DSPACE target up in the staging namespace, including target labels and scrape URL/port.
- [ ] Representative PromQL query results are attached for:
  - `up` for DSPACE;
  - request rate and HTTP 5xx ratio;
  - p95/p99 latency histogram queries;
  - process/runtime metrics;
  - dChat request totals and latency by provider/outcome;
  - token.place dependency outcomes;
  - deployed release/build identity;
  - pod readiness, restarts, CPU, and memory.
- [ ] Dashboard screenshots or exported Grafana JSON references are attached for all required dashboard rows.
- [ ] One controlled alert test is run in staging and produces evidence from Prometheus/Alertmanager plus the operator response notes.
- [ ] Sensitive-label verification is attached by inspecting metric names and label sets from staging. The review must confirm no sensitive labels or log fields are emitted.
- [ ] A staging soak runs long enough to establish provisional alert thresholds and resource behavior before production promotion. Record start/end time, candidate SHA/tag, request mix, token.place configuration, and observed anomalies.
- [ ] Rollback drill or tabletop evidence identifies the previous immutable image tag/digest, prior Helm chart values, command/operator path, expected health checks, and post-rollback verification queries.

### Post-v3.1 follow-ups

- [ ] Move any temporary Sugarkube-owned static scrape config into the canonical `charts/dspace/` chart if the release used a temporary discovery workaround.
- [ ] Refine alert thresholds after production data exists and noisy/non-actionable alerts are identified.
- [ ] Expand dashboards only after the first release slice proves useful; avoid broad business analytics in v3.1.0.
- [ ] Evaluate Loki for logs, distributed tracing, real-user analytics collection, and broad business analytics in separate privacy-reviewed designs. These are not v3.1.0 blockers.
- [ ] Clean up or refresh `infra/monitoring/` local scaffold links and sample metric names after canonical app metrics are implemented.

## Metrics and labels contract

Required metric families should use DSPACE-owned names that clearly scope them to the app, for example:

- `dspace_http_requests_total{route_group,status_class,method,environment,service}`
- `dspace_http_request_duration_seconds_bucket{route_group,status_class,method,environment,service}`
- `process_*` or `nodejs_*` runtime families from `prom-client` default metrics
- `dspace_dchat_requests_total{provider,outcome,environment,service}`
- `dspace_dchat_request_duration_seconds_bucket{provider,outcome,environment,service}`
- `dspace_token_place_requests_total{outcome,environment,service}`
- `dspace_token_place_request_duration_seconds_bucket{outcome,environment,service}`
- `dspace_provider_selection_failures_total{provider,reason_class,environment,service}`
- `dspace_build_info{service,environment,version,git_sha,image_tag}`

Allowed labels are bounded operational dimensions only. Do not label by NPC name, user-entered content, prompt text, response text, model name, source URL, arbitrary path/URL, exception/error message, request ID, player identity, IP address, inventory item, save identifier, OpenAI key, token.place credential, or raw provider response text.

## Dashboard contract

The required DSPACE dashboard must have rows or clearly named sections for:

1. **Availability and traffic**: `up`, blackbox/public health if available, request rate by bounded route group.
2. **Latency percentiles**: p50/p95/p99 from request histograms, with staging baseline annotations.
3. **Status and error ratio**: 2xx/3xx/4xx/5xx status classes and sustained 5xx ratio.
4. **dChat**: request rate, latency, and outcomes by bounded provider/outcome labels.
5. **token.place dependency**: success, timeout, rate limit, malformed response, and server-failure ratios.
6. **Kubernetes pod health**: readiness, restarts, CPU, memory, and relevant saturation from kube-state-metrics/cAdvisor/node metrics.
7. **Release identity**: current `version`, `git_sha`, immutable image tag/digest, environment, and deploy timestamp/annotation when available.

## Alert contract

Initial thresholds must be provisional until staging establishes a baseline. Suggested starting gates are intentionally conservative and must be tuned with staging evidence:

- **Application unavailable**: DSPACE target down or public health probe failing for a short sustained window.
- **Sustained HTTP 5xx ratio**: 5xx status-class ratio above a provisional percentage for a sustained window.
- **Latency regression**: p95 or p99 request latency above the staging baseline by an agreed multiplier or absolute ceiling.
- **token.place dependency failure ratio**: timeout, rate-limit, malformed-response, or server-failure outcomes exceed the provisional staging-derived ratio.
- **dChat timeout/rate-limit spike**: dChat outcomes show a sustained spike in `timeout` or `rate_limited`.
- **Repeated pod restarts**: Kubernetes restart counters increase repeatedly within the release window.

## Rollback requirement

Before production promotion, attach the previous immutable DSPACE image tag/digest, chart version, chart values source, and exact operator rollback path. Rollback validation must include `/healthz`, `/livez`, `/config.json`, Prometheus target recovery, and dashboard release-identity confirmation. Do not rebuild a new image as the rollback path.
