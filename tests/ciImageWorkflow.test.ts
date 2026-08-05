import { describe, expect, it } from 'vitest';
import {
  chmodSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const workflowPath = join(repoRoot, '.github', 'workflows', 'ci-image.yml');
const contents = readFileSync(workflowPath, 'utf8');
const workflow = parse(contents) as {
  on: Record<string, any>;
  jobs: Record<string, any>;
};

function asArray(value: unknown): unknown[] {
  if (value === undefined || value === null) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function findSteps(job: any): any[] {
  return asArray(job?.steps).filter((step) => step && typeof step === 'object');
}

function findStepsUsing(job: any, actionPrefix: string): any[] {
  return findSteps(job).filter(
    (step) =>
      typeof step.uses === 'string' && step.uses.startsWith(actionPrefix)
  );
}

function stepIndex(job: any, predicate: (step: any) => boolean): number {
  return findSteps(job).findIndex(predicate);
}

function runShell(run: string, env: Record<string, string> = {}) {
  const directory = mkdtempSync(join(tmpdir(), 'ci-image-workflow-'));
  const bin = join(directory, 'bin');
  mkdirSync(bin);
  const output = join(directory, 'output');
  const log = join(directory, 'calls.log');
  writeFileSync(output, '');
  writeFileSync(log, '');
  const executable = (name: string, body: string) => {
    const path = join(bin, name);
    writeFileSync(path, `#!/usr/bin/env bash\n${body}`);
    chmodSync(path, 0o755);
  };
  executable(
    'gh',
    'echo gh >> "$MOCK_LOG"\nprintf \'%s\\n\' "$MOCK_RELEASE_JSON"\n'
  );
  executable(
    'git',
    `echo "$*" >> "$MOCK_LOG"
if [[ "$1 $2" == "rev-parse HEAD" ]]; then echo "$MOCK_SOURCE_SHA"; exit 0; fi
if [[ "$1" == "rev-parse" && "$2" == *'^'{commit} ]]; then echo "$MOCK_SOURCE_SHA"; exit 0; fi
if [[ "$1" == "ls-remote" ]]; then
  [[ "${'$'}*" == *refs/heads/main* ]] && exit "${'$'}MOCK_MAIN_LS"
  exit "${'$'}MOCK_V3_LS"
fi
if [[ "$1" == "fetch" ]]; then exit 0; fi
if [[ "$1 $2" == "merge-base --is-ancestor" ]]; then
  [[ "${'$'}*" == *origin/main* ]] && exit "${'$'}MOCK_MAIN_MERGE"
  exit "${'$'}MOCK_V3_MERGE"
fi
if [[ "$1" == "rev-parse" ]]; then echo 1111111111111111111111111111111111111111; exit 0; fi
exit 99
`
  );
  mkdirSync(join(directory, 'charts', 'dspace'), { recursive: true });
  writeFileSync(
    join(directory, 'charts', 'dspace', 'Chart.yaml'),
    'version: 3.0.0\n'
  );
  const result = spawnSync('bash', ['-c', run], {
    cwd: directory,
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${bin}:${process.env.PATH}`,
      GITHUB_OUTPUT: output,
      GITHUB_REPOSITORY: 'democratizedspace/dspace',
      MOCK_LOG: log,
      MOCK_RELEASE_JSON: '{}',
      MOCK_SOURCE_SHA: '0123456789abcdef0123456789abcdef01234567',
      MOCK_MAIN_LS: '2',
      MOCK_V3_LS: '2',
      MOCK_MAIN_MERGE: '1',
      MOCK_V3_MERGE: '1',
      ...env,
    },
  });
  return {
    ...result,
    calls: readFileSync(log, 'utf8'),
    output: readFileSync(output, 'utf8'),
  };
}

describe('ci-image.yml triggers', () => {
  it('keeps ordinary branch coverage on main and v3, with no tag-push trigger', () => {
    expect(workflow.on.push.branches).toEqual(['v3', 'main']);
    expect(workflow.on.pull_request.branches).toEqual(['v3', 'main']);
    expect(workflow.on.push.tags).toBeUndefined();
  });

  it('has exactly one canonical semantic-publication event: a published release', () => {
    expect(workflow.on.release).toEqual({ types: ['published'] });
    // No push.tags trigger alongside release: published — that combination would race
    // and turn every ordinary release into an expected duplicate-publication failure.
    expect(workflow.on.push.tags).toBeUndefined();
  });

  it('keeps an empty manual recovery tag on the ordinary branch-image path', () => {
    expect(workflow.on.workflow_dispatch.inputs.release_tag).toMatchObject({
      type: 'string',
      required: false,
      default: '',
    });
    expect(workflow.jobs.image.if).toBe(
      "github.event_name == 'push' || (github.event_name == 'workflow_dispatch' && github.event.inputs.release_tag == '')"
    );
    expect(workflow.jobs['local-build'].if).toBe(
      "github.event_name != 'release' && !(github.event_name == 'workflow_dispatch' && github.event.inputs.release_tag != '')"
    );
    expect(workflow.jobs['semantic-release'].if).toBe(
      "(github.event_name == 'release' && github.event.action == 'published') || (github.event_name == 'workflow_dispatch' && github.event.inputs.release_tag != '')"
    );
  });

  it('routes empty dispatches to both branch jobs and valid recovery only to semantic release', () => {
    const enabled = (releaseTag: string) => ({
      localBuild: releaseTag === '',
      image: releaseTag === '',
      semanticRelease: releaseTag !== '',
    });
    expect(enabled('')).toEqual({
      localBuild: true,
      image: true,
      semanticRelease: false,
    });
    expect(enabled('v3.1.1')).toEqual({
      localBuild: false,
      image: false,
      semanticRelease: true,
    });
  });
});

describe('ci-image.yml "image" job (ordinary branch publish path)', () => {
  const job = workflow.jobs.image;

  it('never runs for release events', () => {
    expect(job.if).toContain("github.event_name == 'push'");
    expect(job.if).toContain("github.event_name == 'workflow_dispatch'");
    expect(job.if).not.toContain("github.event_name == 'release'");
  });

  it('serializes ordinary publication by target branch without workflow SHA', () => {
    expect(job.concurrency.group).toBe(
      'dspace-image-${{ github.event.inputs.branch || github.ref_name }}'
    );
    expect(job.concurrency.group).not.toContain('github.sha');
    expect(job.concurrency['cancel-in-progress']).toBe(false);
  });

  it('never computes or publishes a semantic version tag', () => {
    const serialized = JSON.stringify(job);
    expect(serialized).not.toMatch(/version_tag/);
    // Guards against the historical bug directly: no step should build a tag string of the
    // shape ghcr.io/.../dspace:v<package-version> in this job.
    expect(serialized).not.toMatch(
      /ghcr\.io\/democratizedspace\/dspace:v\$\{\{/
    );
  });

  it('still publishes the immutable branch-SHA tag and the mutable branch convenience tag', () => {
    const checkout = findStepsUsing(job, 'actions/checkout')[0];
    expect(checkout.with['persist-credentials']).toBe(false);
    const tagsStep = findSteps(job).find((step) => step.id === 'tags');
    expect(tagsStep.env.SOURCE_BRANCH).toBe(
      '${{ github.event.inputs.branch || github.ref_name }}'
    );
    expect(tagsStep.run).toContain('branch="$SOURCE_BRANCH"');
    expect(tagsStep.run).not.toContain('${{ github.event.inputs.branch');
    expect(tagsStep.run).toContain('git rev-parse HEAD');
    expect(tagsStep.run).toContain('git rev-parse --short=7 HEAD');
    expect(tagsStep.run).toMatch(/sha_tag=/);
    expect(tagsStep.run).toMatch(/latest_tag=/);

    const pushSteps = findStepsUsing(job, 'docker/build-push-action');
    const realPushSteps = pushSteps.filter((step) => step.with?.push === true);
    expect(realPushSteps.length).toBeGreaterThan(0);
    for (const step of realPushSteps) {
      expect(step.with.tags).toContain('steps.tags.outputs.sha_tag');
      expect(step.with.tags).toContain('steps.tags.outputs.latest_tag');
      expect(step.with['build-args']).toContain(
        'GIT_SHA=${{ steps.tags.outputs.full_sha }}'
      );
      expect(step.with['build-args']).toContain(
        'VITE_GIT_SHA=${{ steps.tags.outputs.full_sha }}'
      );
      expect(step.with['build-args']).toContain(
        'BUILD_TIMESTAMP=${{ steps.metadata.outputs.created }}'
      );
      expect(step.with['build-args']).toContain(
        'DSPACE_IMAGE=${{ steps.tags.outputs.sha_tag }}'
      );
      expect(step.with.labels).toContain(
        'org.opencontainers.image.revision=${{ steps.metadata.outputs.revision }}'
      );
    }
  });

  it('compares runtime JSON and HTML identity with the OCI revision', () => {
    const step = findSteps(job).find(
      (candidate) =>
        candidate.name === 'Compare runtime identity with OCI revision'
    );
    expect(step.run).toContain('org.opencontainers.image.revision');
    expect(step.run).toContain('/build-info.json');
    expect(step.run).toContain('if [ ! -s /tmp/build-info.json ]; then');
    expect(step.run).toContain('docker logs "$container"');
    expect(step.run).toContain('dspace-build-revision');
    expect(step.env.EXPECTED_SHA).toBe('${{ steps.tags.outputs.full_sha }}');
    expect(step.run).toContain('test "$label_revision" = "$EXPECTED_SHA"');
  });

  it('invokes image verifiers from a repository-preserving mount, not a scripts-only mount', () => {
    const serialized = JSON.stringify(job);
    const shaStep = findSteps(job).find(
      (step) => step.name === 'Assert build SHA is baked into frontend bundle'
    );
    const chatStep = findSteps(job).find(
      (step) => step.name === 'Verify chat build stamp inside image'
    );

    expect(shaStep.run).toContain('-v "$PWD:/verification-repo:ro"');
    expect(shaStep.run).toContain(
      'node /verification-repo/scripts/verify-build-sha.mjs /app/dist'
    );
    expect(chatStep.run).toContain('-v "$PWD:/verification-repo:ro"');
    expect(chatStep.run).toContain('-e VERIFY_REPO_ROOT=/app');
    expect(chatStep.run).toContain(
      '-e VERIFY_BUILD_META_PATH=/app/build_meta.json'
    );
    expect(chatStep.run).toContain(
      'node /verification-repo/scripts/verify-chat-build-stamp.mjs'
    );
    expect(serialized).not.toContain('$PWD/scripts:/scripts:ro');
    expect(serialized).not.toContain(
      'node /scripts/verify-chat-build-stamp.mjs'
    );
  });

  it('builds and locally validates the runtime image before the first registry mutation', () => {
    const steps = findSteps(job);
    const firstPush = stepIndex(
      job,
      (step) => step.name === 'Build and push image (attempt 1)'
    );
    for (const name of [
      'Build image for SHA verification',
      'Assert build SHA is baked into frontend bundle',
      'Verify chat build stamp inside image',
      'Compare runtime identity with OCI revision',
    ]) {
      expect(stepIndex(job, (step) => step.name === name)).toBeGreaterThan(-1);
      expect(stepIndex(job, (step) => step.name === name)).toBeLessThan(
        firstPush
      );
    }

    const verifyBuild = steps.find(
      (step) => step.name === 'Build image for SHA verification'
    );
    expect(verifyBuild.with.push).toBe(false);
    expect(verifyBuild.with.tags).toBe('dspace-verify:latest');
    expect(verifyBuild.with['cache-from']).toBe('type=gha');
    expect(verifyBuild.with['cache-to']).toBe(
      'type=gha,mode=max,ignore-error=true'
    );
  });

  it('guards the immutable SHA tag immediately before both push attempts', () => {
    const steps = findSteps(job);
    const guard1 = steps.find(
      (step) =>
        step.name === 'Ensure immutable SHA tag is absent before push attempt 1'
    );
    const guard2 = steps.find(
      (step) =>
        step.name === 'Ensure immutable SHA tag is absent before push attempt 2'
    );
    const push1 = steps.find(
      (step) => step.name === 'Build and push image (attempt 1)'
    );
    const push2 = steps.find(
      (step) => step.name === 'Build and push image (attempt 2)'
    );

    expect(steps.indexOf(guard1)).toBe(steps.indexOf(push1) - 1);
    expect(steps.indexOf(guard2)).toBe(steps.indexOf(push2) - 1);
    for (const guard of [guard1, guard2]) {
      expect(guard.run).toContain('scripts/ghcr-manifest.mjs check-absent');
      expect(guard.env.GHCR_GUARD_USERNAME).toBe('${{ github.actor }}');
      expect(guard.env.GHCR_GUARD_PASSWORD).toBe('${{ secrets.GITHUB_TOKEN }}');
      expect(guard.env.IMAGE_TAG).toBe('${{ steps.tags.outputs.sha_tag }}');
      expect(guard.run).toContain('--tag "${IMAGE_TAG##*:}"');
      expect(guard.run).not.toContain('${{ secrets.GITHUB_TOKEN }}');
    }
  });

  it('requires a failed first push and successful retry guard before attempt 2', () => {
    const guard2 = findSteps(job).find(
      (step) =>
        step.name === 'Ensure immutable SHA tag is absent before push attempt 2'
    );
    const push2 = findSteps(job).find(
      (step) => step.name === 'Build and push image (attempt 2)'
    );
    expect(guard2.if).toBe("steps.build_push_1.outcome == 'failure'");
    expect(push2.if).toBe(
      "steps.build_push_1.outcome == 'failure' && steps.check_sha_absent_2.outcome == 'success'"
    );
  });
  it('uses the checked-out commit rather than the dispatch event SHA', () => {
    const serialized = JSON.stringify(job);
    expect(serialized).not.toContain('GIT_SHA=${{ github.sha }}');
    expect(serialized).not.toContain('VITE_GIT_SHA=${{ github.sha }}');
    expect(
      findSteps(job).find((step) => step.id === 'metadata').env.GIT_SHA
    ).toBe('${{ steps.tags.outputs.full_sha }}');
  });

  it('keeps multi-arch publication for both supported architectures', () => {
    const pushSteps = findStepsUsing(job, 'docker/build-push-action').filter(
      (step) => step.with?.push === true
    );
    for (const step of pushSteps) {
      expect(step.with.platforms).toBe('linux/amd64,linux/arm64');
    }
  });
});

describe('ci-image.yml "local-build" job (PR path)', () => {
  const job = workflow.jobs['local-build'];

  it('never pushes an image', () => {
    const pushSteps = findStepsUsing(job, 'docker/build-push-action');
    expect(pushSteps.length).toBeGreaterThan(0);
    for (const step of pushSteps) {
      expect(step.with.push).toBe(false);
    }
  });

  it('does not run redundantly for release events', () => {
    expect(job.if).toContain("github.event_name != 'release'");
    expect(job.if).toContain(
      "github.event_name == 'workflow_dispatch' && github.event.inputs.release_tag != ''"
    );
  });
});

describe('ci-image.yml "semantic-release" job (normal and recovery alias path)', () => {
  const job = workflow.jobs['semantic-release'];
  const steps = findSteps(job);
  const named = (name: string) => steps.find((step) => step.name === name);

  it('accepts published release events or explicit recovery dispatches and serializes by tag', () => {
    expect(job.if).toBe(
      "(github.event_name == 'release' && github.event.action == 'published') || (github.event_name == 'workflow_dispatch' && github.event.inputs.release_tag != '')"
    );
    expect(job.concurrency.group).toContain('github.event.release.tag_name');
    expect(job.concurrency.group).toContain('github.event.inputs.release_tag');
    expect(job.concurrency['cancel-in-progress']).toBe(false);
  });

  it('requires a stable tag belonging to an existing published, non-draft GitHub release', () => {
    const release = named('Resolve and authorize published release');
    const valid = JSON.stringify({
      tag_name: 'v3.1.1',
      draft: false,
      published_at: '2026-08-05T00:00:00Z',
    });
    const passed = runShell(release.run, {
      RELEASE_TAG: 'v3.1.1',
      MOCK_RELEASE_JSON: valid,
    });
    expect(passed.status).toBe(0);
    expect(passed.output).toBe('tag=v3.1.1\n');
    expect(passed.calls).toBe('gh\n');

    for (const tag of ['', '3.1.1', 'v3.1.1-rc.1']) {
      const failed = runShell(release.run, {
        RELEASE_TAG: tag,
        MOCK_RELEASE_JSON: valid,
      });
      expect(failed.status).not.toBe(0);
      expect(failed.calls).toBe('');
    }
    for (const releaseJson of [
      { tag_name: 'v3.1.1', draft: true, published_at: '2026-08-05T00:00:00Z' },
      { tag_name: 'v3.1.1', draft: false, published_at: null },
    ]) {
      const failed = runShell(release.run, {
        RELEASE_TAG: 'v3.1.1',
        MOCK_RELEASE_JSON: JSON.stringify(releaseJson),
      });
      expect(failed.status).not.toBe(0);
      expect(failed.calls).toBe('gh\n');
      expect(failed.output).toBe('');
    }
  });

  it('authorizes the checked-out source before lifecycle execution', () => {
    const checkout = findStepsUsing(job, 'actions/checkout')[0];
    expect(checkout.with.ref).toBe('${{ steps.release.outputs.tag }}');
    expect(checkout.with['persist-credentials']).toBe(false);
    const authorization = named('Authorize release source');
    expect(authorization.env.RELEASE_TAG).toBe(
      '${{ steps.release.outputs.tag }}'
    );
    expect(authorization.run).toContain(
      'git rev-parse "${RELEASE_TAG}^{commit}"'
    );
    expect(authorization.run).toContain('refs/remotes/origin/$branch');
    expect(authorization.run).toContain('git ls-remote --exit-code --heads');
    expect(authorization.run).toContain('elif [[ $status -ne 2 ]]');
    expect(authorization.run).toContain('${#containing_branches[@]} == 1');
    expect(authorization.run).not.toContain('|| true');
    expect(authorization.run).not.toContain(
      '${{ github.event.release.tag_name }}'
    );
    expect(steps.indexOf(authorization)).toBeLessThan(
      steps.indexOf(named('Validate all local release coordinates'))
    );
    expect(JSON.stringify(job)).not.toContain('pnpm install');
  });

  it.each([
    ['main', { MOCK_MAIN_LS: '0', MOCK_V3_LS: '2', MOCK_MAIN_MERGE: '0' }],
    ['v3', { MOCK_MAIN_LS: '2', MOCK_V3_LS: '0', MOCK_V3_MERGE: '0' }],
  ])('authorizes the sole existing containing branch: %s', (branch, env) => {
    const result = runShell(named('Authorize release source').run, {
      RELEASE_TAG: 'v3.1.1',
      ...env,
    });
    expect(result.status).toBe(0);
    expect(result.output).toContain(`source_branch=${branch}\n`);
    expect(result.calls.match(/^fetch .*$/gm)).toEqual([
      `fetch https://github.com/democratizedspace/dspace.git ${branch}:refs/remotes/origin/${branch} --quiet`,
    ]);
  });

  it.each([
    ['neither branch exists', {}],
    ['branch discovery is indeterminate', { MOCK_MAIN_LS: '3' }],
    [
      'containment is indeterminate even when the other branch contains the source',
      {
        MOCK_MAIN_LS: '0',
        MOCK_V3_LS: '0',
        MOCK_MAIN_MERGE: '3',
        MOCK_V3_MERGE: '0',
      },
    ],
    [
      'both branches contain the source',
      {
        MOCK_MAIN_LS: '0',
        MOCK_V3_LS: '0',
        MOCK_MAIN_MERGE: '0',
        MOCK_V3_MERGE: '0',
      },
    ],
  ])('fails closed when %s', (_case, env) => {
    const result = runShell(named('Authorize release source').run, {
      RELEASE_TAG: 'v3.1.1',
      ...env,
    });
    expect(result.status).not.toBe(0);
  });

  it('pins Node before invoking the release consistency gate', () => {
    const setup = findStepsUsing(job, 'actions/setup-node')[0];
    expect(setup.with['node-version-file']).toBe('.nvmrc');
    expect(steps.indexOf(setup)).toBeLessThan(
      steps.indexOf(named('Validate all local release coordinates'))
    );
  });

  it('uses the reusable gate for local, image, chart, and manifest validation', () => {
    for (const mode of [
      '--verify-local',
      '--verify-image',
      '--verify-chart',
      '--emit-manifest',
      '--validate-manifest',
    ]) {
      expect(JSON.stringify(job)).toContain(
        `check-release-consistency.mjs ${mode}`
      );
    }
    expect(
      steps.indexOf(named('Verify immutable image provenance'))
    ).toBeLessThan(steps.indexOf(named('Verify published chart provenance')));
    expect(
      steps.indexOf(named('Verify published chart provenance'))
    ).toBeLessThan(steps.indexOf(named('Publish semantic alias exactly once')));
  });

  it('checks semantic absence twice and immediately before one bounded alias mutation', () => {
    const guards = steps.filter((step) => step.run?.includes('--pre-semantic'));
    expect(guards).toHaveLength(2);
    const alias = named('Publish semantic alias exactly once');
    expect(steps.indexOf(guards[1])).toBe(steps.indexOf(alias) - 1);
    expect(alias.run.match(/docker buildx imagetools create/g)).toHaveLength(1);
    expect(alias.run).toContain('@${IMAGE_DIGEST}');
    expect(JSON.stringify(job)).not.toContain('docker/build-push-action');
    expect(JSON.stringify(job)).not.toContain('docker build ');
  });

  it('verifies semantic digest equality after publication', () => {
    const verify = named('Verify semantic alias digest equality');
    expect(verify.env.EXPECTED_IMAGE_DIGEST).toBe(
      '${{ steps.immutable_image.outputs.indexDigest }}'
    );
    expect(steps.indexOf(verify)).toBeGreaterThan(
      steps.indexOf(named('Publish semantic alias exactly once'))
    );
  });

  it('uploads a deterministic validated manifest with a pinned action', () => {
    const emit = named('Emit and validate release manifest');
    expect(emit.env.RELEASE_MANIFEST_PATH).toBe('dspace-release-manifest.json');
    const upload = named('Upload release manifest');
    expect(upload.uses).toMatch(/^actions\/upload-artifact@[0-9a-f]{40}$/);
    expect(upload.with.name).toBe('dspace-release-manifest');
    expect(upload.with.path).toBe('dspace-release-manifest.json');
    expect(steps.indexOf(upload)).toBeGreaterThan(steps.indexOf(emit));
  });

  it('summarizes full immutable source, image, platform, chart, and manifest evidence', () => {
    const summary = named('Write complete release evidence');
    for (const field of [
      'Full source SHA',
      'Immutable image',
      'linux/amd64 manifest',
      'linux/arm64 manifest',
      'Immutable chart',
      'Release manifest artifact',
    ]) {
      expect(summary.run).toContain(field);
    }
    expect(summary.run).not.toMatch(/password|GITHUB_TOKEN/i);
  });

  it('passes event-controlled strings and credentials as environment data', () => {
    for (const step of steps) {
      if (!step.run) continue;
      expect(step.run).not.toContain('${{ github.event.release.tag_name }}');
      expect(step.run).not.toContain('${{ secrets.GITHUB_TOKEN }}');
    }
  });
});
