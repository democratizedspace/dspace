# Owner-run v3.0.2 image publication

This separate publisher builds only reviewed source
`bfb910201e23119cb26902d8ca6787070150b695`, tree
`5f5b75243bb51b71d13e04f9b42dcc5609b5bcff`. It does not deploy or create releases.
GitHub-hosted runners provide Docker/Buildx/QEMU. The owner needs repository write
access to dispatch, not local Docker or a new token. Existing repository
`GITHUB_TOKEN` package access must work; stop on access failure without granting
permissions or provisioning credentials as part of this task.

## Exact source and owner review waiver

PR [#4876](https://github.com/democratizedspace/dspace/pull/4876) merged into
`release/v3.0.x` as `25db174e27c0e66493284cbddb931dd54a466745`. Build its reviewed
head `bfb910201e23119cb26902d8ca6787070150b695`, not the merge commit or publisher
tip. Its only change from the preceding maintenance commit is the November 15
pending changelog heading. Application 3.0.2 and Node 24.22.1 remain unchanged.
The owner accepts intervening release-tooling changes and reuses the intermediate
staging revision 32 functional checks, including successful live chat.

The owner explicitly waived AI-review completion for this one-line date change.
The code binds this exception independently to PR #4876, its full head SHA and
source tree. It does not fabricate completed bot reviews or create an input flag
that could waive another source. Unresolved review threads, observed unresolved
Codex findings, outstanding requested changes and dismissed reviews still block.
When present, completed Greptile/Copilot summaries must match the captured clear
#4876 bodies and IDs; changed or unknown summaries stop for inspection rather than
being silently ignored. Absence still does not require waiting for completion.
All required CI checks and the complete workflow/status gates remain enforced.
The owner excludes the two obsolete RPi workflows from this candidate gate:
`rpi-deploy.yml` run `43764737285` and `deploy-to-raspi.yml` run `43764736304`.
These are exact source-head push initialization failures, completed on attempt 1
with zero jobs across all attempts. The exception checks source SHA, run ID,
workflow path, push event, first attempt and zero jobs. It does not ignore another
source, a manual deployment, a rerun, a job failure or unrelated CI. Historical
run IDs remain rejected. Workflow deletion is separate cleanup (K-424).

Publication attempt [43769239728](https://github.com/democratizedspace/dspace/actions/runs/43769239728)
stopped at this evidence gate before the image build; publication was skipped and
no receipt was uploaded. After merging this correction, use the new workflow-control
SHA for a new owner dispatch. Do not rerun the old workflow revision.

Review and merge this publisher update into `release/v3.0.x` before dispatch.
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
  -f source_sha=bfb910201e23119cb26902d8ca6787070150b695 -F publish=false
```

Do not dispatch another branch, `ci-image.yml`, `ci-helm.yml`, or either legacy
Raspberry Pi deployment workflow.

After owner approval of validation, run the same maintenance workflow with
`publish=true` and confirmation exactly:

```text
publish v3.0.2 bfb910201e23119cb26902d8ca6787070150b695
```

The corresponding **separately approved owner publication action** is:

```bash
gh workflow run build.yml --repo democratizedspace/dspace --ref release/v3.0.x \
  -f source_sha=bfb910201e23119cb26902d8ca6787070150b695 -F publish=true \
  -f 'confirmation=publish v3.0.2 bfb910201e23119cb26902d8ca6787070150b695'
```

The job revalidates the source, merged PR, ancestry, tree, version, full CI/run
history and repository review evidence. The only registry coordinate it may push is:

```text
ghcr.io/democratizedspace/dspace:hotfix-bfb910201e23119cb26902d8ca6787070150b695
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
as `v3.0.2+bfb9102`; health text is not artifact-version proof.

The owner applies the explicit image override to staging, checks the deployed
digest/source, Node 24.22.1, health and functional paths, then approves promotion of
the same digest to production. Repeat identity/runtime/function checks. Only after
successful production verification create Git tag `v3.0.2` at the approved image's
source SHA (not the later publisher workflow commit). Keep the application source
SHA and workflow-control SHA separate in the receipt. See
[the security handoff](v3.0.2-security-hotfix.md) for checks and rollback gates.

The separate P1 postmortem and development-branch changelog guidance/validator sync
remain follow-ups. No publication or rollout is performed by this PR.

## Recover November publication verification

Run 43164575478 published the November image but failed its post-push fetch.
Do not rerun the publisher or overwrite the image. Preserve the failure receipt
and stop for a verification-only recovery bound to this new source and its published
digests. The [historical November recovery](published-image-558ce3c-verification.md)
is fixed to source `558ce3c` and cannot verify this candidate. Staging and production
remain separate owner gates.

## Bounded post-push reads

Only the post-push pull-token and published-tag index GETs retry: at most four
attempts per request, each with a 30-second timeout covering headers and body,
with 1, 2, and 4 seconds between attempts. Retryable responses are HTTP 408,
429, 500, 502, 503 and 504, plus transient connection, socket and timeout errors.
Redirects, authorization failures, other HTTP responses, certificate failures,
invalid JSON/schema and digest mismatches stop immediately. No response bodies,
credentials, signed URLs or raw transport errors appear in diagnostics.

The publisher hashes the raw index bytes against the Buildx metadata digest and
also requires the registry digest header to match before using platform digests.
Its receipt remains `published: true, verified: false` on any verification
failure, with a sanitized failure stage and completed smoke results. Only both
successful architecture smokes set `verified: true`.

Exhaustion never retries a build, push, workflow or smoke. Preserve the failure
receipt and prepare a source-specific fixed-digest verification-only recovery;
do not dispatch the publisher to recover. The existing historical
verifier and November recovery workflow retain their fixed identities and guards.
These offline checks do not establish live published-image verification:

```sh
node --test scripts/test-maintenance-image-reads.mjs
node --test scripts/test-verify-published-image-558ce3c.mjs
node --test scripts/test-verify-published-image.mjs
```
