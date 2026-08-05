# DSPACE 3.1.1 release handoff

This repository preparation advances DSPACE to application `3.1.1` and chart `3.1.2` without
creating tags, GitHub releases, GHCR artifacts, or deployment changes. It exists so the post-merge
release run can provide the remaining operational evidence for [DSPACE #4727](https://github.com/democratizedspace/dspace/issues/4727)
and [DSPACE #4730](https://github.com/democratizedspace/dspace/issues/4730).

## Expected coordinates after merge

Replace `MERGE_SHA` with the exact reviewed merge commit on `main` and `SHORT_SHA` with its first
seven hexadecimal characters.

- Branch image tag: `ghcr.io/democratizedspace/dspace:main-SHORT_SHA`
- Chart tag: `chart-v3.1.2`
- Chart OCI coordinate: `oci://ghcr.io/democratizedspace/charts/dspace --version 3.1.2`
- Application release tag: `v3.1.1`
- Semantic image alias: `ghcr.io/democratizedspace/dspace:v3.1.1`
- Release manifest artifact: `dspace-release-manifest/dspace-release-manifest.json`

## Required post-merge release evidence

1. Confirm `main` published and verified the immutable multi-platform branch-SHA image
   `main-SHORT_SHA`, and that both `linux/amd64` and `linux/arm64` platform configs identify
   `MERGE_SHA`.
2. Create `chart-v3.1.2` at `MERGE_SHA` only after the branch image exists, then confirm the chart
   workflow published exactly one immutable chart whose OCI metadata records chart version `3.1.2`,
   app version `3.1.1`, and source revision `MERGE_SHA`.
3. Publish the GitHub application release `v3.1.1` only after the image and chart prerequisites are
   verified from the same source revision.
4. Confirm the first semantic publication succeeds exactly once and creates
   `ghcr.io/democratizedspace/dspace:v3.1.1` as a digest-preserving alias of
   `ghcr.io/democratizedspace/dspace:main-SHORT_SHA`.
5. Rerun the semantic release job and confirm it fails at the GHCR existence guard before any
   publication or mutation attempt.
6. Re-read the semantic image digest after the rerun and confirm it remains unchanged.
7. Download `dspace-release-manifest.json` and confirm it agrees with the source revision, immutable
   image tag, image index digest, platform evidence, chart version, chart digest, and semantic tag.

Do not mutate staging, production, or rollback coordinates as part of this repository preparation.

Refs #4727
Refs #4730
