# DSPACE v3.1.0 observability release requirements

> Status: release-planning design for v3.1.0. This document does not implement metrics,
> dashboards, alerts, exporters, Helm resources, package versions, chart versions, or runtime
> behavior.

## Source of truth and release status

DSPACE v3.1.0 has not shipped in this repository state. The package and canonical release chart
metadata remain `3.0.1`, so any v3.1.0 wording in forward-looking docs is release intent unless a
future immutable tag, image digest, release note, and QA sign-off prove otherwise.

This plan aligns DSPACE with the Sugarkube observability design, which makes application
repositories responsible for `/metrics`, bounded labels, release/build identity, app-owned Helm
scrape hooks, and privacy guarantees while Sugarkube owns Prometheus, Grafana, Alertmanager,
blackbox probing, and platform-wide discovery policy.

## Repository evidence inventory

| Area                                   | Status                                       | Evidence and release implication                                                                                                                                                                                                                                                                                   |
| -------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| DSPACE package metadata                | Implemented                                  | `package.json` reports version `3.0.1`; do not describe v3.1.0 as shipped from this branch.                                                                                                                                                                                                                        |
| Canonical GHCR/Sugarkube Helm chart    | Partial                                      | `charts/dspace/` is the chart packaged and pushed by `.github/workflows/ci-helm.yml` to `oci://ghcr.io/democratizedspace/charts`. It exposes the app Service and health probes, but has no ServiceMonitor, metrics Service port, network policy, or alert templates.                                               |
| Legacy / alternate deployment chart    | Partial / legacy for this release path       | `deploy/charts/dspace/` has a richer k3s chart with a metrics port, ServiceMonitor, NetworkPolicy, and PrometheusRule scaffolding. Current GHCR chart publishing does not package this tree, so v3.1.0 release evidence must not rely on it unless release automation is intentionally changed in a separate task. |
| Environment values under `deploy/env/` | Partial / legacy for this release path       | These values enable metrics, ServiceMonitor, and alerts for the alternate chart, including production digest pinning. They are useful design evidence but are not the canonical GHCR chart inputs today.                                                                                                           |
| Application metrics endpoint           | Partial                                      | `frontend/src/pages/metrics.ts` serves Prometheus text from `prom-client` default metrics and supports optional `METRICS_TOKEN` bearer auth on the Astro route. It does not prove staging/production scraping, route-level HTTP metrics, dChat metrics, token.place dependency metrics, or release labels.         |
| Metrics implementation                 | Partial                                      | `frontend/src/utils/metrics.js` initializes `prom-client` default runtime/process collectors when available and falls back to plain text. There are no custom metric families for v3.1.0 release gates yet.                                                                                                        |
| Local monitoring scaffold              | Implemented for local use, not release proof | `infra/monitoring/` provides a local Docker Compose Prometheus/Grafana stack, dashboard JSON, static scrape config, and sample alerts. It is not proof that Sugarkube staging or production discovers the app.                                                                                                     |
| Monitoring setup docs                  | Implemented / local only                     | `docs/ops/monitoring_setup.md` documents localhost monitoring and explicitly says to restrict metrics access if exposed beyond localhost.                                                                                                                                                                          |
| Existing alert scaffolding             | Partial                                      | Local alerts cover target down, 5xx rate, and latency with sample thresholds. They do not cover token.place dependency health, dChat outcomes, pod restarts, or staging evidence.                                                                                                                                  |
| Existing dashboard scaffold            | Partial                                      | The local dashboard covers basic availability, HTTP 5xx, and latency. It is missing dChat, token.place, pod resources/restarts, and deployed release identity rows.                                                                                                                                                |

## Canonical chart decision

For the current GHCR/Sugarkube release path, the canonical chart is `charts/dspace/` because
`.github/workflows/ci-helm.yml` runs `helm dependency build charts/dspace`, `helm lint
charts/dspace`, `helm package charts/dspace`, and pushes that package to
`oci://ghcr.io/democratizedspace/charts`.

Do not blindly update both chart trees for v3.1.0 observability. Release blockers below name what
must exist in the canonical chart path before promotion. The `deploy/charts/dspace/` tree should be
treated as an alternate or legacy k3s chart until maintainers either retire it or make it the
published chart in a separate release-engineering change.

## Classification key

- **v3.1.0 release blocker**: must be implemented and verified before v3.1.0 production promotion.
- **required staging evidence**: must be attached to the v3.1.0 QA record before production
  promotion; thresholds may remain provisional until the staging soak completes.
- **post-v3.1 follow-up**: intentionally outside the first release slice.

## v3.1.0 release blockers

### Application scrape contract

- [ ] **v3.1.0 release blocker**: Staging and production expose a Prometheus-compatible DSPACE
      endpoint for in-cluster scraping.
- [ ] **v3.1.0 release blocker**: The endpoint path and port are documented from the deployed
      release. If the Astro `/metrics` route remains canonical, the Service must scrape the HTTP app
      port; if a dedicated metrics port is used, its listener, container port, Service port, and
      endpoint path must be implemented and tested together.
- [ ] **v3.1.0 release blocker**: `charts/dspace/` contains the canonical Helm scrape
      configuration for the GHCR/Sugarkube release path, including either a ServiceMonitor template
      or an explicitly documented equivalent discovery mechanism.
- [ ] **v3.1.0 release blocker**: ServiceMonitor or equivalent discovery labels are compatible with
      Sugarkube kube-prometheus-stack discovery. Use the current `release: kube-prometheus-stack`
      convention unless the Sugarkube platform selector changes in a separate verified platform PR.
- [ ] **v3.1.0 release blocker**: Metrics are reachable by in-cluster Prometheus without exposing a
      privileged metrics surface publicly. Acceptable patterns are app-side bearer auth with an
      in-cluster secret, cluster-only Service plus NetworkPolicy allowing Prometheus from the
      monitoring namespace, ingress exclusion for `/metrics`, or an equivalent design documented in
      the release evidence.
- [ ] **v3.1.0 release blocker**: Metrics include bounded release/build identity such as version,
      image tag or digest, commit SHA, environment, and chart version. Do not attach unbounded branch
      names, request IDs, source URLs, or arbitrary deployment annotations as labels.

### Required metric families

- [ ] **v3.1.0 release blocker**: HTTP request totals use bounded route groups and status classes,
      for example route groups such as `root`, `chat`, `config`, `health`, `metrics`, `docs`, and
      `other`, and status classes such as `2xx`, `3xx`, `4xx`, and `5xx`.
- [ ] **v3.1.0 release blocker**: HTTP latency histograms use the same bounded route groups and
      status classes with staging-reviewed buckets.
- [ ] **v3.1.0 release blocker**: Process/runtime health is present through default runtime metrics
      and/or explicit process health gauges.
- [ ] **v3.1.0 release blocker**: dChat request totals and latency are measurable by bounded
      provider category and outcome category. Provider categories must stay bounded, for example
      `token_place`, `openai`, `local_stub`, and `unknown`; outcome categories must stay bounded,
      for example `success`, `timeout`, `rate_limited`, `provider_error`, `malformed_response`, and
      `client_error`.
- [ ] **v3.1.0 release blocker**: token.place dependency metrics separately count successes,
      timeouts, rate limits, malformed responses, and server failures without recording prompts,
      responses, URLs, credentials, or user identifiers.
- [ ] **v3.1.0 release blocker**: Provider-selection failures and fallback behavior are counted
      where measurable on the server, with bounded reasons such as `missing_config`,
      `unsupported_provider`, `missing_key`, and `fallback_used`.
- [ ] **v3.1.0 release blocker**: Deployment/release information is exported as a low-cardinality
      build info metric or equivalent labels on safe gauges.

### Privacy and cardinality constraints

- [ ] **v3.1.0 release blocker**: Metrics and logs never record prompts, responses, OpenAI keys,
      token.place credentials, save data, inventory, player identity, IP addresses, arbitrary URLs,
      request IDs as labels, or exception text as labels.
- [ ] **v3.1.0 release blocker**: Labels cannot grow with NPC names, user content, model names,
      source URLs, route params, dependency URLs, error messages, exception types from arbitrary
      libraries, or free-form provider names.
- [ ] **v3.1.0 release blocker**: Safe operational metrics are explicitly separated from
      browser-only debugging information. Browser debug panels may help QA inspect selected provider
      payloads, but they are not a production metrics source and must not feed Prometheus.

### Dashboard requirement

- [ ] **v3.1.0 release blocker**: A DSPACE Grafana dashboard, or exported JSON equivalent for the
      Sugarkube dashboard repository, contains rows or panels for availability and request rate,
      latency percentiles, status/error ratio, dChat traffic and outcomes, token.place dependency
      health, pod readiness/restarts/resources, and deployed release identity.
- [ ] **required staging evidence**: Attach dashboard screenshots or exported JSON references from
      staging. Screenshots must not reveal secrets, prompts, user data, or private hostnames beyond
      approved staging URLs.

### Alert requirement

All alert thresholds are provisional until staging establishes a baseline. Do not invent historical
production numbers.

- [ ] **v3.1.0 release blocker**: Define release-gating alerts for application unavailable,
      sustained HTTP 5xx ratio, latency regression, token.place dependency failure ratio, dChat
      timeout or rate-limit spike, and repeated pod restarts.
- [ ] **v3.1.0 release blocker**: Alert labels use bounded `service`, `environment`, `severity`, and
      `runbook`-style metadata only. They must not include prompts, responses, request IDs, user
      identifiers, arbitrary URLs, or exception text.
- [ ] **required staging evidence**: Run one controlled alert test in staging and attach the alert
      firing/resolution evidence plus the mitigation or rollback note used during the drill.

### Rollback

- [ ] **v3.1.0 release blocker**: The release record names the prior immutable DSPACE image tag or
      digest and includes the exact rollback command or deployment procedure.
- [ ] **required staging evidence**: Staging rollback instructions are dry-run reviewed before
      production promotion.

## Required staging evidence before production promotion

- [ ] **required staging evidence**: Prometheus target discovery shows the DSPACE target as `UP` in
      the expected namespace and environment.
- [ ] **required staging evidence**: Representative PromQL query results are attached for HTTP
      request rate, HTTP latency histogram quantiles, dChat outcomes, token.place dependency health,
      runtime/process health, pod readiness/restarts/resources, and release identity.
- [ ] **required staging evidence**: Dashboard screenshots or exported JSON references are attached.
- [ ] **required staging evidence**: One controlled alert test fires and resolves as expected.
- [ ] **required staging evidence**: A privacy review verifies no sensitive labels or log fields are
      emitted by metrics, alert annotations, dashboard variables, browser debug surfaces, or related
      scrape targets.
- [ ] **required staging evidence**: Staging soak evidence covers enough representative traffic to
      review provisional alert thresholds before production promotion. The soak should include normal
      `/chat` traffic, token.place success, timeout/rate-limit or simulated failure, health probes,
      and a deploy/restart observation.
- [ ] **required staging evidence**: Rollback instructions using the prior immutable image tag or
      digest are attached and reviewed.

## Post-v3.1 follow-ups

- [ ] **post-v3.1 follow-up**: Loki log aggregation, log-derived dashboards, or central log alerting.
- [ ] **post-v3.1 follow-up**: Distributed tracing with Tempo/OpenTelemetry spans.
- [ ] **post-v3.1 follow-up**: Real-user analytics collection or browser telemetry beyond local QA
      debug surfaces.
- [ ] **post-v3.1 follow-up**: Broad business/product analytics, quest funnel analytics, or
      per-content dashboards.
- [ ] **post-v3.1 follow-up**: Retire or consolidate duplicate Helm chart trees after maintainers
      choose a single long-term chart source.
