---
title: 'DSPACE v3.1.0 Observability Requirements'
slug: 'observability-v3.1'
---

DSPACE v3.1.0 observability is an active release-planning requirement, not a shipped claim. The
canonical release requirements live in
[`docs/design/observability-v3.1.md`](https://github.com/democratizedspace/dspace/blob/main/docs/design/observability-v3.1.md).

Before v3.1.0 production promotion, maintainers must verify the Prometheus scrape contract, bounded
metrics and labels, dashboard coverage, release-gating alerts, staging evidence, privacy review, and
rollback procedure described in that design.
