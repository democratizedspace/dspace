import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
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

describe('ci-image.yml triggers', () => {
  it('keeps ordinary branch coverage on main and v3, with no tag-push trigger', () => {
    expect(workflow.on.push.branches).toEqual(['v3', 'main']);
    expect(workflow.on.pull_request.branches).toEqual(['v3', 'main']);
    expect(workflow.on.push.tags).toBeUndefined();
  });

  it('has exactly one canonical semantic-publication event: a published release', () => {
    expect(workflow.on.release).toBeTruthy();
    expect(workflow.on.release.types).toContain('published');
    // No push.tags trigger alongside release: published — that combination would race
    // and turn every ordinary release into an expected duplicate-publication failure.
    expect(workflow.on.push.tags).toBeUndefined();
  });
});

describe('ci-image.yml "image" job (ordinary branch publish path)', () => {
  const job = workflow.jobs.image;

  it('never runs for release events', () => {
    expect(job.if).toContain("github.event_name == 'push'");
    expect(job.if).toContain("github.event_name == 'workflow_dispatch'");
    expect(job.if).not.toMatch(/release/);
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
      expect(step.with.labels).toContain(
        'org.opencontainers.image.revision=${{ steps.metadata.outputs.revision }}'
      );
      expect(step.with['build-args']).toContain(
        'BUILD_CREATED_AT=${{ steps.metadata.outputs.created }}'
      );
      expect(step.with['build-args']).toContain(
        'DSPACE_IMAGE=${{ steps.tags.outputs.sha_tag }}'
      );
    }
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
    expect(job.if).toBe("github.event_name != 'release'");
  });

  it('compares runtime and HTML revisions to the OCI revision label', () => {
    const serialized = JSON.stringify(job);
    expect(serialized).toContain('/build-info.json');
    expect(serialized).toContain('dspace-build-revision');
    expect(serialized).toContain('org.opencontainers.image.revision');
    expect(serialized).toContain('RUNTIME_REVISION');
    expect(serialized).toContain('HTML_REVISION');
    expect(serialized).toContain('OCI_REVISION');
  });
});

describe('ci-image.yml "semantic-release" job (release-only alias path)', () => {
  const job = workflow.jobs['semantic-release'];
  const steps = findSteps(job);
  const named = (name: string) => steps.find((step) => step.name === name);

  it('is release-only and serialized by semantic tag', () => {
    expect(job.if).toBe(
      "github.event_name == 'release' && github.event.action == 'published'"
    );
    expect(job.concurrency.group).toContain('github.event.release.tag_name');
    expect(job.concurrency['cancel-in-progress']).toBe(false);
  });

  it('authorizes the checked-out source before lifecycle execution', () => {
    const checkout = findStepsUsing(job, 'actions/checkout')[0];
    expect(checkout.with.ref).toContain('github.event.release.tag_name');
    expect(checkout.with['persist-credentials']).toBe(false);
    const authorization = named('Authorize release source');
    expect(authorization.env.RELEASE_TAG).toContain('release.tag_name');
    expect(authorization.run).toContain(
      'git rev-parse "${RELEASE_TAG}^{commit}"'
    );
    expect(authorization.run).toContain('refs/remotes/origin/main');
    expect(authorization.run).not.toContain(
      '${{ github.event.release.tag_name }}'
    );
    expect(steps.indexOf(authorization)).toBeLessThan(
      steps.indexOf(named('Validate all local release coordinates'))
    );
    expect(JSON.stringify(job)).not.toContain('pnpm install');
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
