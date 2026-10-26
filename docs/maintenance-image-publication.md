# Owner-run v3.0.2 image publication

This separate publisher builds only reviewed source
`47900748f61e1ef38c6289fc697f7a070f7fa3c9`, tree
`35391f8fb62827713889915cba3c906090e45c7f`. It does not deploy or create releases.
GitHub-hosted runners provide Docker/Buildx/QEMU. The owner needs repository write
access to dispatch, not local Docker or a new token. Existing repository
`GITHUB_TOKEN` package access must work; stop on access failure without granting
permissions or provisioning credentials as part of this task.

## Merge and review sequence

1. Review hotfix PR #4850 at the exact source above. The owner accepted only its
   two byte-identical legacy initialization failures, runs 40276727866 and
   40276728723. All other checks and reviews must stay green.
2. Merge #4850 into `release/v3.0.x` preserving the approved source commit as an
   ancestor (a normal merge, not squash/rebase). Record actual merge SHA. If a
   different strategy is chosen, stop: this publisher will reject the changed
   source and requires separately reviewed policy/validation changes.
3. This publisher PR is initially stacked on `codex/v3.0.2-node-security`. After
   #4850 merges, retarget it to `release/v3.0.x`, verify only publisher changes
   remain, and repeat required final-head CI/reviews. Do not merge main/v3 code.
   Its workflow/script tests and independent review are required. Any legacy
   failures at its new head need a separate owner decision: the source waiver
   does not extend to this publisher PR. Do not merge it until that gate is settled.
4. Merge the approved publisher into `release/v3.0.x`, record its actual workflow
   SHA and verify the merged files match the reviewed tree. `build.yml` already
   exists on default branch main with manual dispatch; invoke its maintenance
   version explicitly. No main-branch synchronization is needed to publish.

Owner review here means inspecting the PR and authorizing/performing its merge;
the author is not required to submit an approval review on their own PR. The
publisher checks completed repository AI reviews and outstanding requested changes.
It does not demand a human GitHub APPROVED event from the author.

The maintenance branch does not automatically run the full suite on merge:
`ci.yml` and `tests.yml` push triggers cover main/v3, and `build.yml` push triggers
cover main/codex branches. Full checks run on the hotfix/publisher PR heads. This
publisher uses the already tested hotfix source SHA, never an untested merge SHA;
its exact tree is pinned and must remain an ancestor of the maintenance tip.
The separately reviewed publisher workflow tree must match the merged files.
If retargeting or conflict resolution changes either reviewed tree, stop for fresh
checks/review. An empty merge-SHA check list is not a substitute for the required
source-head evidence. The subsequent validation-only dispatch is an explicit new
owner action; publication is a second, separately confirmed action.

## Validate first, then explicitly publish

Use GitHub Actions workflow file **build.yml** (its displayed name may differ on
the default branch), choose branch `release/v3.0.x`,
and enter the full approved `source_sha` above. First leave `publish=false` and
`confirmation` empty. Inspect both architecture smoke results and download
`maintenance-validation-receipt`. A skipped job or missing receipt is not success.
Do not dispatch another branch, `ci-image.yml`, `ci-helm.yml`, or either legacy
Raspberry Pi deployment workflow.

After owner approval of validation, run the same maintenance workflow with
`publish=true` and confirmation exactly:

```text
publish v3.0.2 47900748f61e1ef38c6289fc697f7a070f7fa3c9
```

The job revalidates the source, merged PR, ancestry, tree, version, full CI/run
history and repository review evidence. The only registry coordinate it may push is:

```text
ghcr.io/democratizedspace/dspace:hotfix-47900748f61e1ef38c6289fc697f7a070f7fa3c9
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

The owner applies the explicit image override to staging, checks the deployed
digest/source, Node 24.22.1, health and functional paths, then approves promotion of
the same digest to production. Repeat identity/runtime/function checks. Only after
successful production verification create Git tag `v3.0.2` at the approved image's
source SHA (not the later publisher workflow commit). Keep the application source
SHA and workflow-control SHA separate in the receipt. See
[the security handoff](v3.0.2-security-hotfix.md) for checks and rollback gates.

The separate P1 postmortem and development-branch changelog guidance/validator sync
remain follow-ups. No publication or rollout is performed by this PR.
