import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const workflow = readFileSync(
  new URL('../.github/workflows/verify-published-image.yml', import.meta.url),
  'utf8'
);
const native = workflow
  .split('  native-candidate:')[1]
  .split('  aggregate:')[0];
const aggregate = workflow.split('  aggregate:')[1];
const fixtures = workflow
  .split('  offline-fixtures:')[1]
  .split('  native-candidate:')[0];

test('candidate execution is owner-only main dispatch; PRs only run offline tests', () => {
  for (const job of [native, aggregate]) {
    for (const guard of [
      "github.event_name == 'workflow_dispatch'",
      "github.repository == 'democratizedspace/dspace'",
      "github.ref == 'refs/heads/main'",
      "github.actor == 'futuroptimist'",
      "github.triggering_actor == 'futuroptimist'",
    ])
      assert.ok(job.includes(guard), guard);
  }
  assert.ok(fixtures.includes("github.event_name == 'pull_request'"));
  assert.doesNotMatch(fixtures, /run:.*verify-candidate-image\.mjs/);
  assert.doesNotMatch(workflow, /pull_request_target|setup-qemu|workflow_call/);
});

test('inputs are data; trusted full-history checkout never uses candidate ref', () => {
  for (const job of [native, aggregate]) {
    assert.ok(job.includes('ref: ${{ github.sha }}'));
    assert.ok(job.includes('fetch-depth: 0'));
    assert.ok(job.includes('persist-credentials: false'));
    assert.ok(job.includes('DSPACE_SOURCE_SHA: ${{ inputs.source_sha }}'));
    assert.ok(job.includes('DSPACE_IMAGE_DIGEST: ${{ inputs.image_digest }}'));
  }
  const commands = workflow.split('\n').filter((line) => /\brun:/.test(line));
  assert.equal(commands.length, 4);
  for (const line of commands) {
    assert.doesNotMatch(line, /\$\{\{|[|>]/);
    assert.match(
      line,
      /run: node (?:--test scripts\/verify-candidate|scripts\/verify-candidate-image\.mjs)/
    );
  }
});

test('native matrix has both pinned runners and no publication or credentials', () => {
  for (const section of [native, fixtures]) {
    assert.match(section, /runner: ubuntu-24\.04\n\s+arch: amd64/);
    assert.match(section, /runner: ubuntu-24\.04-arm\n\s+arch: arm64/);
    assert.ok(section.includes('fail-fast: false'));
  }
  assert.ok(workflow.includes('permissions:\n  contents: read'));
  assert.doesNotMatch(
    workflow,
    /packages:|id-token:|secrets\.|login-action|--push|docker push/
  );
});

test('aggregate always requires both same-run artifacts and job success', () => {
  assert.ok(aggregate.includes('needs: native-candidate'));
  assert.ok(aggregate.includes('if: always() &&'));
  assert.ok(
    aggregate.includes(
      'DSPACE_NATIVE_JOB_RESULT: ${{ needs.native-candidate.result }}'
    )
  );
  assert.ok(
    aggregate.includes(
      'pattern: candidate-image-*-${{ github.run_id }}-${{ github.run_attempt }}'
    )
  );
  assert.ok(
    aggregate.includes(
      'run: node scripts/verify-candidate-image.mjs --aggregate candidate-receipts'
    )
  );
  assert.ok(native.includes('path: candidate-image-${{ matrix.arch }}.json'));
  assert.ok(aggregate.includes('path: candidate-image-summary.json'));
  assert.equal((workflow.match(/if-no-files-found: error/g) || []).length, 2);
});
