# DSPACE v3.1.0 observability release design

This document makes observability an explicit, verifiable release requirement for DSPACE v3.1.0. It is release-planning documentation only: do not implement metrics, dashboards, alerts, exporters, Helm resources, chart versions, or package versions from this document alone.

The design aligns DSPACE with the canonical Sugarkube observability contract in [Sugarkube observability design](https://github.com/futuroptimist/sugarkube/blob/main/docs/observability-design.md). That upstream design keeps `kube-prometheus-stack` in the `monitoring` namespace as the platform default, expects application repositories to own `/metrics` endpoints and bounded labels, uses `release: kube-prometheus-stack` for current ServiceMonitor discovery, and treats staging data as the source for final thresholds.

## Current repository evidence

| Area                           | Status                                        | Evidence and release interpretation                                                                                                                                                                                                                                                                                                                           |
| ------------------------------ | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Package/chart version metadata | Implemented for v3.0.1; v3.1.0 not shipped    | `package.json`, `charts/dspace/Chart.yaml`, `deploy/charts/dspace/Chart.yaml`, and `docs/apps/dspace.version` remain at `3.0.1`. v3.1.0 docs must stay forward-looking until an actual tag/artifact exists.                                                                                                                                                   |
| Runtime `/metrics` route       | Partial                                       | `frontend/src/pages/metrics.ts` exposes Prometheus text from `prom-client` and honors `METRICS_TOKEN` when set. It currently depends on default `prom-client` metrics only through `frontend/src/utils/metrics.js`.                                                                                                                                           |
| Dedicated metrics port         | Partial                                       | `infra/docker/entrypoint.mjs` starts `infra/metrics.mjs` when `DSPACE_METRICS_PORT` is set; `infra/metrics.mjs` serves `/metrics` on port `9464` by default and collects default process metrics, but it does not enforce `METRICS_TOKEN`. Treat this port as cluster-only until an authenticated or network-isolated scrape path is verified.                |
| HTTP/dChat/token.place metrics | Missing                                       | The repository does not currently define bounded HTTP request counters/histograms, dChat counters/histograms, token.place dependency outcome counters, provider-selection failure counters, or release build-info metrics.                                                                                                                                    |
| Local monitoring scaffold      | Legacy/local only                             | `infra/monitoring/` provides local Docker Compose Prometheus/Grafana, sample alerts, and a sample dashboard. It is useful for development but is not Sugarkube staging/production evidence.                                                                                                                                                                   |
| Canonical Sugarkube chart      | Implemented path, partial observability hooks | The canonical chart for the current GHCR/Sugarkube release path is `charts/dspace`, because `.github/workflows/ci-helm.yml` packages and publishes that chart to `oci://ghcr.io/democratizedspace/charts/dspace`, and `docs/ops/sugarkube-release.md` names that OCI chart for Sugarkube deployment.                                                          |
| Duplicate/legacy chart tree    | Legacy/duplicate, not current GHCR path       | `deploy/charts/dspace` includes richer ServiceMonitor, NetworkPolicy, metrics-port, and alert templates, and older docs call it the Flux production chart. It is not packaged by the current GHCR chart workflow and must not be updated blindly for v3.1.0 release evidence. Use it only as prior art until maintainers intentionally reconcile chart trees. |
| Static k8s manifests           | Legacy/reference                              | `infra/k8s/` documents k3s/Sugarkube context but is not the OCI chart consumed by the current release runbook.                                                                                                                                                                                                                                                |

## Release classification key

Every requirement below is classified as one of:

- **v3.1.0 release blocker**: must exist before v3.1.0 promotion.
- **required staging evidence**: must be captured from staging before production promotion.
- **post-v3.1 follow-up**: intentionally outside the first release slice.

## Application scrape contract

| Requirement                                                             | Classification         | Acceptance detail                                                                                                                                                                                                                                                                                                                             |
| ----------------------------------------------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prometheus-compatible endpoint exists in staging and production.        | v3.1.0 release blocker | Staging and production DSPACE pods expose `GET /metrics` in Prometheus text format on the approved cluster-only scrape path.                                                                                                                                                                                                                  |
| Canonical Helm scrape configuration is identified.                      | v3.1.0 release blocker | Use `charts/dspace` as the canonical GHCR/Sugarkube chart. If it lacks final scrape hooks at release time, document the exact Sugarkube-owned temporary scrape configuration and a post-v3.1 follow-up to move the hook into `charts/dspace`.                                                                                                 |
| ServiceMonitor or equivalent discovery labels are Sugarkube-compatible. | v3.1.0 release blocker | The selected scrape hook uses the kube-prometheus-stack selector convention `release: kube-prometheus-stack`, or an explicitly documented equivalent approved in Sugarkube. Do not assume `sugarkube.dev/monitor: "true"` is active unless platform values are changed.                                                                       |
| Metrics auth and exposure are safe.                                     | v3.1.0 release blocker | In-cluster Prometheus can scrape without exposing a privileged public metrics surface. Acceptable patterns are: `METRICS_TOKEN` bearer auth on the scraped app route, a cluster-only Service and NetworkPolicy allowing only `monitoring`, or an equivalent ingress-deny rule. The unauthenticated dedicated metrics port must not be public. |
| Release/build identity has bounded labels.                              | v3.1.0 release blocker | Expose one bounded build-info metric or bounded labels such as `service="dspace"`, `environment`, `version`, `commit`, and `image_tag`. Do not attach request IDs, URLs, user data, or unbounded model strings.                                                                                                                               |

## Required metric families

Metric names are suggested for consistency; equivalent names are acceptable if the dashboard and alerts query them directly and labels stay bounded.

| Metric family                         | Required labels                                            | Classification                                      | Notes                                                                                                                                                                                                                                                                     |
| ------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HTTP request totals                   | `route_group`, `method`, `status_class`, `environment`     | v3.1.0 release blocker                              | `route_group` must be a small allowlist such as `home`, `chat`, `config`, `health`, `metrics`, `docs`, `quests`, `assets`, `api`, and `other`; never use raw paths.                                                                                                       |
| HTTP latency histogram                | `route_group`, `method`, `status_class`, `environment`     | v3.1.0 release blocker                              | Buckets should fit staging latency observations; thresholds stay provisional until the staging soak.                                                                                                                                                                      |
| Process/runtime health                | `service`, `environment`, `pod` where platform-provided    | v3.1.0 release blocker                              | `prom-client` default process metrics are acceptable for process/runtime health if scraped from the same target and visible in dashboards.                                                                                                                                |
| dChat request totals                  | `provider`, `outcome`, `environment`                       | v3.1.0 release blocker                              | `provider` must be bounded to approved buckets such as `token_place`, `openai`, `local`, `unknown`; `outcome` must be bounded to `success`, `timeout`, `rate_limited`, `provider_error`, `malformed_response`, `client_error`, `config_error`, `fallback`, and `unknown`. |
| dChat latency histogram               | `provider`, `outcome`, `environment`                       | v3.1.0 release blocker                              | Measure server-observable dChat requests only. Browser-only timing/debug panels are not release-gating operational metrics.                                                                                                                                               |
| token.place dependency outcomes       | `outcome`, `environment`                                   | v3.1.0 release blocker                              | Must distinguish successes, timeouts, rate limits, malformed responses, and server failures. Optional `provider="token_place"` is acceptable because it is bounded.                                                                                                       |
| Provider-selection failures/fallbacks | `from_provider`, `to_provider`, `reason`, `environment`    | v3.1.0 release blocker where measurable server-side | Use bounded reasons such as `missing_key`, `config_error`, `dependency_error`, `timeout`, and `manual_selection`. If a flow is browser-only and not server-measurable, document that gap as post-v3.1 follow-up rather than fabricating server data.                      |
| Deployment/release information        | `service`, `environment`, `version`, `commit`, `image_tag` | v3.1.0 release blocker                              | Use a gauge with value `1` or equivalent low-cardinality build-info series.                                                                                                                                                                                               |

## Privacy and cardinality constraints

These are **v3.1.0 release blockers**:

- Never record prompts, responses, OpenAI keys, token.place credentials, save data, inventory, player identity, IP addresses, arbitrary URLs, request IDs as labels, or exception text as labels.
- Do not use labels that can grow with NPC names, player content, model names, source URLs, raw routes, error messages, stack traces, or upstream response bodies.
- Browser-only debugging information, prompt debug panels, local storage state, and developer console details are not safe operational metrics. Keep them separate from Prometheus metrics and release dashboards.
- Logs used as staging evidence must be sampled or inspected for sensitive fields, but v3.1.0 does not require Loki or centralized log collection.

## Dashboard requirement

A DSPACE dashboard is a **v3.1.0 release blocker** and its staging screenshot or exported JSON reference is **required staging evidence**. Keep the first dashboard small and operational:

1. Availability and request rate: `up`, scrape health, and HTTP requests per second by `route_group` and `status_class`.
2. Latency percentiles: p50, p95, and p99 from HTTP histograms by `route_group`.
3. Status/error ratio: 4xx and 5xx percentages over total traffic.
4. dChat traffic and outcomes: request rate, latency, and outcome split by bounded `provider` and `outcome`.
5. token.place dependency health: success, timeout, rate-limit, malformed-response, and 5xx/server-failure rates.
6. Pod readiness/restarts/resources: ready replicas, restart counts, CPU, memory, and saturation from kube-state-metrics/kubelet metrics.
7. Deployed release identity: current DSPACE version, commit, image tag, and environment.

## Alert requirement

Alerts below are **v3.1.0 release blockers**. Thresholds are provisional until staging establishes a baseline; do not claim they are based on historical production behavior.

| Alert                                | Provisional starting point                                                    | Evidence required                                                               |
| ------------------------------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Application unavailable              | `up{service="dspace"} == 0` or no ready replicas for 5 minutes                | Controlled target-down or equivalent alert test in staging.                     |
| Sustained HTTP 5xx ratio             | 5xx / total HTTP requests above 5% for 10 minutes                             | Staging PromQL result and owner approval after baseline review.                 |
| Latency regression                   | p95 HTTP latency above the staging baseline plus agreed margin for 10 minutes | Record staging baseline and final threshold before production.                  |
| token.place dependency failure ratio | token.place non-success outcomes above 10% for 10 minutes                     | Include timeout, rate-limit, malformed response, and server-failure categories. |
| dChat timeout or rate-limit spike    | dChat timeout or rate-limited outcomes above 5% for 10 minutes                | Separate token.place and OpenAI buckets where server-measurable.                |
| Repeated pod restarts                | More than 2 restarts for any DSPACE pod over 15 minutes                       | Verify with kube-state-metrics or equivalent platform metric.                   |

## Staging evidence required before production promotion

All items in this section are **required staging evidence** and should be attached to the v3.1.0 QA record:

- Prometheus target discovery shows the DSPACE target up in staging, including the scrape job name, namespace, and labels.
- Representative PromQL query results for `up`, HTTP request rate, HTTP latency histogram, dChat outcomes, token.place outcomes, process/runtime metrics, and release/build identity.
- Dashboard screenshots or exported dashboard JSON references for the DSPACE dashboard rows listed above.
- One controlled alert test, such as temporarily blocking the scrape target in staging or using an agreed synthetic failure, with evidence that the alert fires and resolves.
- Verification that metrics labels and inspected log fields do not include prompts, responses, keys, credentials, save data, inventory, player identity, IP addresses, arbitrary URLs, request IDs, or exception text labels.
- Staging soak evidence before production promotion: at least one maintainer-approved soak window with representative `/chat`, `/config.json`, `/healthz`, `/livez`, and docs/quest traffic plus no unresolved release-blocking alerts.
- Rollback instructions recorded with the prior immutable image tag. Use the Sugarkube release runbook rollback flow, redeploying the prior `main-<shortsha>` or `v3-<shortsha>` tag rather than rebuilding locally.

## Post-v3.1 follow-ups intentionally excluded from blockers

- Loki or any centralized log aggregation rollout.
- Distributed tracing/Tempo/OpenTelemetry spans.
- Real-user analytics collection or browser beacon telemetry.
- Broad business/product analytics beyond the operational metrics above.
- Reconciliation of `deploy/charts/dspace` into `charts/dspace`, unless maintainers choose to make chart consolidation part of a separate PR.
- Long-term alert threshold tuning after production baselines exist.
