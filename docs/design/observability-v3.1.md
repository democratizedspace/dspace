# DSPACE v3.1.0 Observability Release Gate

This design turns observability into an explicit DSPACE v3.1.0 release requirement. It is a
planning and QA contract only: it does not implement new metrics, dashboards, alerts, exporters,
Helm templates, or version metadata.

Status: v3.1.0 is not treated as shipped by this document. The repository metadata still reports
`package.json` version `3.0.1`, and the active GHCR Helm publishing workflow packages
`charts/dspace`, whose chart and app versions are also `3.0.1`. Forward-looking roadmap or QA text
must therefore be read as release planning until a v3.1.0 tag, immutable image, chart, staging
evidence, and production promotion are recorded.

## Source alignment

This gate is aligned with the Sugarkube observability design at
<https://github.com/futuroptimist/sugarkube/blob/main/docs/observability-design.md>. DSPACE adopts
the Sugarkube naming, labeling, privacy, dashboard, alert, and staging-evidence posture for the
smallest useful v3.1.0 release slice.

## Repository evidence inventory

| Area                          | Evidence                                                                                                                                          | Classification                          | v3.1.0 implication                                                                                                                                              |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime version               | `package.json` is `3.0.1`.                                                                                                                        | Implemented for v3.0.1; v3.1.0 missing. | Do not claim v3.1.0 shipped until release metadata and immutable artifacts exist.                                                                               |
| Metrics route                 | `frontend/src/pages/metrics.ts` exposes `/metrics` and optionally requires `Authorization: Bearer <METRICS_TOKEN>`.                               | Partial.                                | Endpoint exists, but staging/prod scrape behavior and public exposure controls still need evidence.                                                             |
| Metric implementation         | `frontend/src/utils/metrics.js` initializes `prom-client` default process metrics only, with a fallback text response.                            | Partial.                                | Process/runtime basics may exist; DSPACE-specific HTTP, dChat, token.place, fallback, and build-info metrics are missing until implemented elsewhere.           |
| Local monitoring scaffold     | `infra/monitoring/` contains local Prometheus, Grafana dashboard, and alert examples.                                                             | Legacy/local scaffold.                  | Useful as reference only; not the canonical Sugarkube release gate. Metric names and thresholds are not sufficient for v3.1.0.                                  |
| Canonical GHCR chart          | `.github/workflows/ci-helm.yml` packages and publishes `charts/dspace` to `oci://ghcr.io/democratizedspace/charts/dspace`.                        | Implemented v3.0.1 path.                | `charts/dspace` is the canonical chart path for the current GHCR/Sugarkube release path.                                                                        |
| Canonical chart scrape config | `charts/dspace` has Service, Deployment, and probes, but no ServiceMonitor, metrics service port, PrometheusRule, or scrape values.               | Missing.                                | v3.1.0 blocker: add or otherwise identify the canonical scrape configuration before promotion.                                                                  |
| Duplicate chart tree          | `deploy/charts/dspace` contains ServiceMonitor, PrometheusRule, NetworkPolicy, and metrics values, but is not packaged by the GHCR Helm workflow. | Partial legacy/experimental duplicate.  | Do not update both chart trees blindly. Either migrate the needed scrape contract into `charts/dspace` or explicitly retarget release automation before v3.1.0. |
| Environment values            | `deploy/env/{dev,int,prod}/values.yaml` exist for the duplicate deploy chart.                                                                     | Legacy/partial.                         | Not canonical release evidence unless the release path changes and automation points at that chart.                                                             |

## Canonical Helm chart decision

For the current GHCR/Sugarkube release path, the canonical chart is:

```text
charts/dspace
```

Reason: the Helm publishing workflow builds dependencies, lints, packages, pushes, and exports the
chart reference from `charts/dspace`. The `deploy/charts/dspace` tree is treated as a duplicate
legacy or experimental chart until maintainers explicitly change release automation. v3.1.0 work
must not rely on `deploy/charts/dspace` ServiceMonitor or PrometheusRule resources as canonical
release evidence unless the workflow and runbooks are changed in the same release-planning stream.

## Release classifications

Every requirement below is classified as one of:

- **v3.1.0 release blocker**: must exist before v3.1.0 production promotion.
- **required staging evidence**: must be captured from staging before production promotion.
- **post-v3.1 follow-up**: intentionally deferred and not a v3.1.0 blocker.

## Application scrape contract

### v3.1.0 release blockers

- [ ] Staging and production expose a Prometheus-compatible DSPACE endpoint for in-cluster
      scraping.
- [ ] The canonical scrape configuration is in, or explicitly referenced by, `charts/dspace`.
- [ ] The canonical chart renders a ServiceMonitor or equivalent discovery mechanism compatible
      with Sugarkube's Prometheus operator labels.
- [ ] Discovery labels include the Sugarkube-compatible monitoring release label selected by the
      cluster operator, plus stable app labels for `app=dspace`, namespace, environment, cluster,
      and Helm release identity through metric labels or Prometheus relabeling.
- [ ] Authentication and network behavior allow Prometheus in the cluster to scrape metrics without
      exposing a privileged metrics surface publicly.
- [ ] If `METRICS_TOKEN` remains the endpoint guard, the ServiceMonitor or equivalent scrape config
      includes tested bearer-token Secret wiring; if a cluster-only metrics service or NetworkPolicy
      is used instead, public ingress must not route to `/metrics`.
- [ ] Release/build identity is available with bounded labels, for example
      `dspace_build_info{version,revision,release,environment}` with value `1` or equivalent
      relabeled metadata.

### Required staging evidence

- [ ] Prometheus target discovery shows the DSPACE staging target as `up` for the canonical chart
      release.
- [ ] The target labels show bounded `app`, `environment`, `cluster`, `namespace`, and `release`
      identity.
- [ ] A direct public request to the staging public origin cannot access privileged metrics unless
      an explicit public-safe strategy has been approved.
- [ ] The staging scrape still succeeds from the monitoring namespace when public access is denied.

## Required metric families

### v3.1.0 release blockers

- [ ] HTTP request totals, using bounded labels: method, route group, status class, and outcome.
- [ ] HTTP request latency histograms in seconds, using bounded route groups instead of raw URLs.
- [ ] Process/runtime health from safe server-side collection: process CPU, memory, event-loop or
      runtime saturation where available, and process start time.
- [ ] dChat request totals by bounded provider category and bounded outcome category.
- [ ] dChat latency histograms by bounded provider category and outcome category.
- [ ] token.place dependency metrics for successes, timeouts, rate limits, malformed responses, and
      server failures.
- [ ] Provider-selection failures and fallback behavior where measurable on the server, with
      bounded outcome labels only.
- [ ] Deployment/release information through build-info or equivalent low-cardinality labels.

### Required staging evidence

- [ ] PromQL returns non-empty HTTP request totals and latency buckets after representative staging
      traffic.
- [ ] PromQL returns process/runtime metrics for the deployed pod.
- [ ] PromQL returns dChat totals and latency after a staging token.place Chat request.
- [ ] PromQL returns token.place dependency outcomes after controlled success and error-path checks.
- [ ] PromQL returns release/build identity for the candidate image digest or SHA under test.

## Privacy and cardinality constraints

### v3.1.0 release blockers

- [ ] Metrics, labels, dashboards, alerts, and routine operational logs never record prompts,
      responses, OpenAI keys, token.place credentials, save data, inventory, player identity, IP
      addresses, arbitrary URLs, request IDs as labels, or exception text as labels.
- [ ] Labels do not grow with NPC names, user content, model names, source URLs, error messages,
      raw routes, request IDs, sessions, player identifiers, or arbitrary provider strings.
- [ ] Browser-only debugging information remains separate from safe operational metrics. Debug
      panels may help manual QA, but they are not Prometheus metrics and must not be scraped or
      exported as release evidence.
- [ ] dChat provider labels use a bounded set such as `tokenplace`, `openai`, `none`, or `unknown`;
      outcome labels use a bounded set such as `success`, `timeout`, `rate_limited`,
      `validation_error`, `malformed_response`, `dependency_failure`, `server_error`,
      `fallback_used`, `fallback_unavailable`, or `unknown_error`.

### Required staging evidence

- [ ] Inspect `/metrics` output from staging through the approved scrape path and confirm no
      sensitive label names or values are emitted.
- [ ] Inspect relevant staging logs for the controlled Chat and dependency-error tests and confirm
      no prompts, responses, credentials, save data, inventory, player identity, IP addresses,
      request IDs, arbitrary URLs, or exception text are emitted as labels or structured fields used
      for dashboards.

## DSPACE dashboard requirement

### v3.1.0 release blockers

A DSPACE dashboard must exist for staging before production promotion. It must contain rows or
sections for:

- [ ] Availability and request rate.
- [ ] Latency percentiles, including p50, p95, and p99 where histogram data supports them.
- [ ] Status and error ratio by bounded status class.
- [ ] dChat traffic and outcomes.
- [ ] token.place dependency health.
- [ ] Pod readiness, restarts, CPU, memory, and resource pressure.
- [ ] Deployed release identity, including image tag/digest or revision where available.

### Required staging evidence

- [ ] Attach dashboard screenshots or exported dashboard JSON references from staging.
- [ ] Panels are backed by real staging Prometheus data, not placeholders or mock data.

## Alert requirement

Thresholds below are provisional until staging establishes a baseline. They are release-gating
candidate alerts, not claims about historical production behavior.

### v3.1.0 release blockers

- [ ] Application unavailable: public probe or scrape-backed availability fails for 3-5 minutes,
      with staging warning severity and production critical severity after baseline review.
- [ ] Sustained HTTP 5xx ratio: 5xx responses exceed a provisional 5% ratio for 10 minutes, or a
      stricter value justified by staging baseline.
- [ ] Latency regression: p95 or p99 HTTP latency exceeds a provisional staging-derived threshold
      for 15 minutes. Use 5 seconds as an initial review ceiling for app/API paths only until real
      staging data replaces it.
- [ ] token.place dependency failure ratio: timeout, rate-limit, malformed-response, or server-error
      outcomes exceed a provisional 10% ratio for 10 minutes, then tune from staging.
- [ ] dChat timeout or rate-limit spike: bounded timeout or rate-limit outcomes exceed staging
      baseline for 10 minutes.
- [ ] Repeated pod restarts: pod restarts increase by more than 3 in 15 minutes or Kubernetes shows
      CrashLoopBackOff.
- [ ] Every alert has an owner, severity, runbook link, and mitigation or rollback action before it
      can block production promotion.

### Required staging evidence

- [ ] At least one controlled alert test is executed in staging and recorded with start time,
      expected firing condition, notification or Prometheus evidence, mitigation, and recovery.
- [ ] Alert thresholds are reviewed after a staging soak and either retained as provisional for
      production or adjusted with evidence.

## Staging soak and promotion evidence

### Required staging evidence

- [ ] Successful Prometheus target discovery for the canonical DSPACE staging release.
- [ ] Representative PromQL query results for availability, HTTP request rate, HTTP latency,
      status/error ratio, dChat outcomes, token.place dependency outcomes, pod health, and release
      identity.
- [ ] Dashboard screenshots or exported JSON references.
- [ ] One controlled alert test.
- [ ] Verification that no sensitive labels or dashboard/log fields are emitted.
- [ ] A staging soak long enough to observe normal Chat traffic, dependency behavior, pod restarts,
      and resource usage before production promotion. The release owner records the soak duration;
      do not invent historical baselines.
- [ ] Production rollback instructions name the prior immutable DSPACE image tag or digest and the
      prior chart reference or values revision.

## Rollback requirement

### v3.1.0 release blockers

- [ ] Before production promotion, record the prior immutable image tag or digest.
- [ ] Before production promotion, record the prior chart reference and values revision used in the
      environment.
- [ ] Rollback uses the prior immutable image tag/digest rather than `latest` or a mutable branch
      tag.
- [ ] If observability fails but user traffic remains healthy, do not rebuild the application only
      to restore dashboards; first roll back or fix scrape configuration according to the runbook.

## Explicit post-v3.1 follow-ups

These are intentionally outside the first v3.1.0 release slice and must not become blockers unless a
maintainer explicitly changes the scope:

- [ ] Loki deployment and broad log aggregation.
- [ ] Distributed tracing.
- [ ] Real-user analytics collection.
- [ ] Broad business analytics beyond safe operational counters.
- [ ] High-cardinality client-side debugging telemetry.
- [ ] Production threshold tuning after at least one measured production week.
