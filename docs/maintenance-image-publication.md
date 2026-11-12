# Owner-run v3.0.2 image publication

This separate publisher builds only reviewed source
`558ce3c35163d97aea5594d6aba430c6a3dde1a3`, tree
`e3896f76dbdfa6c2cc615a31a85075eb49afa02f`. It does not deploy or create releases.
GitHub-hosted runners provide Docker/Buildx/QEMU. The owner needs repository write
access to dispatch, not local Docker or a new token. Existing repository
`GITHUB_TOKEN` package access must work; stop on access failure without granting
permissions or provisioning credentials as part of this task.

## Review and bounded source exceptions

PR [#4870](https://github.com/democratizedspace/dspace/pull/4870) is merged into
`release/v3.0.x` as `9b0867402aefbd5acae61129b8e680407b7a4a04`. The publisher builds
its reviewed head `558ce3c35163d97aea5594d6aba430c6a3dde1a3`, not the merge commit
or a later publisher tip. That source includes the November 11 pending changelog
heading and preserves application 3.0.2 and Node 24.22.1. It remains descended
from the original hotfix source; no main/v3.1 application changes are imported.

The owner-approved exception covers only these two unchanged legacy
initialization failures on source `558ce3c35163d97aea5594d6aba430c6a3dde1a3`:

- [`deploy-to-raspi.yml`, run 42994229967](https://github.com/democratizedspace/dspace/actions/runs/42994229967)
- [`rpi-deploy.yml`, run 42994228265](https://github.com/democratizedspace/dspace/actions/runs/42994228265)

Each exception requires its exact full source SHA, numeric run ID and workflow
path, `status=completed`, `conclusion=failure`, `run_attempt=1`, and exactly zero
jobs across all attempts. Missing or changed evidence fails closed. The
source-specific exceptions for the prior `4790074` image do not transfer; neither
do these exceptions cover another source, run, workflow path, rerun, or a failure
that starts jobs. Publisher-head failures, including runs 43125103519 and
43125101846 from #4871, require their own owner decision and are not allowlisted.
Do not dispatch either legacy deployment workflow.

All other source-head checks, full workflow history and repository AI reviews
remain required. The new Greptile summary uses different wording: the publisher
accepts only the exact captured source-bound comment body (with its retrigger
signature redacted before hashing), not arbitrary high-confidence summaries.
Changed or newer blocking evidence remains rejected. The author is not required
to approve their own PR; outstanding requested changes still block publication.

Review and merge this exception change into
`release/v3.0.x`, then verify the merged publisher files match the reviewed tree.
Record the workflow SHA separately from the application source SHA.
`build.yml` already exists on default branch main with manual dispatch; invoke
its maintenance version explicitly. No main-branch synchronization is needed.
An empty merge-SHA check list is not a substitute for source-head evidence. If
conflict resolution changes a reviewed tree, stop for fresh checks and review.
The validation-only dispatch and later publication are separate owner actions.

## Validate first, then explicitly publish

Use GitHub Actions workflow file **build.yml** (its displayed name may differ on
the default branch), choose branch `release/v3.0.x`,
and enter the full approved `source_sha` above. First leave `publish=false` and
`confirmation` empty. Inspect both architecture smoke results and download
`maintenance-validation-receipt`. A skipped job or missing receipt is not success.
If the web UI shows only default-branch inputs, use an existing authenticated
GitHub CLI/API connection with an explicit maintenance ref; do not change the
default branch or create a token. For example, this **owner-only future action**
starts validation without publication:

```bash
gh workflow run build.yml --repo democratizedspace/dspace --ref release/v3.0.x \
  -f source_sha=558ce3c35163d97aea5594d6aba430c6a3dde1a3 -F publish=false
```

Do not dispatch another branch, `ci-image.yml`, `ci-helm.yml`, or either legacy
Raspberry Pi deployment workflow.

After owner approval of validation, run the same maintenance workflow with
`publish=true` and confirmation exactly:

```text
publish v3.0.2 558ce3c35163d97aea5594d6aba430c6a3dde1a3
```

The corresponding **separately approved owner publication action** is:

```bash
gh workflow run build.yml --repo democratizedspace/dspace --ref release/v3.0.x \
  -f source_sha=558ce3c35163d97aea5594d6aba430c6a3dde1a3 -F publish=true \
  -f 'confirmation=publish v3.0.2 558ce3c35163d97aea5594d6aba430c6a3dde1a3'
```

The job revalidates the source, merged PR, ancestry, tree, version, full CI/run
history and repository review evidence. The only registry coordinate it may push is:

```text
ghcr.io/democratizedspace/dspace:hotfix-558ce3c35163d97aea5594d6aba430c6a3dde1a3
```

It fails closed unless GHCR explicitly reports that manifest absent. A publication
concurrency lock serializes this workflow; owners must not use another publisher
for this coordinate. GHCR tags are not a server-enforced immutable lock, so all
rollout references must use the recorded digest. No latest/semantic alias, chart,
Git tag, release, SSH or cluster command runs. There is no blind retry: after an
uncertain push or existing coordinate, inspect registry evidence and stop rather
than rebuild/overwrite. A failed post-publication check may leave an image in GHCR;
it must not be promoted. Only a receipt with `published=true`, `verified=true`,
matching source/tree/workflow SHA and both platform digests is rollout evidence.

## Staging, production and post-cutover tag

Use the verified receipt's actual image digest; none is known in advance. Complete
the private pre-rollout log/inventory preservation checkpoint, confirm environment
identities and prior artifact/rollback receipts, and select an existing verified
compatible chart. Do not package the modified historical chart 3.0.1.

The prior image digest and its staging evidence remain historical: neither proves
this changed source. Before staging, update the DSPACE companion smoke runner and
Sugarkube verifier with the actual published source/tag/digest tuple and verified
OCI index, manifest and config bytes. Preserve the old tuples. Do not substitute
the prior digest or enable a wildcard. Chart 3.1.3 may remain unchanged if its
existing provenance is verified. Configure this source's separate health label
as `v3.0.2+558ce3c`; health text is not artifact-version proof.

The owner applies the explicit image override to staging, checks the deployed
digest/source, Node 24.22.1, health and functional paths, then approves promotion of
the same digest to production. Repeat identity/runtime/function checks. Only after
successful production verification create Git tag `v3.0.2` at the approved image's
source SHA (not the later publisher workflow commit). Keep the application source
SHA and workflow-control SHA separate in the receipt. See
[the security handoff](v3.0.2-security-hotfix.md) for checks and rollback gates.

The separate P1 postmortem and development-branch changelog guidance/validator sync
remain follow-ups. No publication or rollout is performed by this PR.
