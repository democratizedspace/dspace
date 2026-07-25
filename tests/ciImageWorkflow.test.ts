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
    const tagsStep = findSteps(job).find((step) => step.id === 'tags');
    expect(tagsStep.run).toMatch(/sha_tag=/);
    expect(tagsStep.run).toMatch(/latest_tag=/);

    const pushSteps = findStepsUsing(job, 'docker/build-push-action');
    const realPushSteps = pushSteps.filter((step) => step.with?.push === true);
    expect(realPushSteps.length).toBeGreaterThan(0);
    for (const step of realPushSteps) {
      expect(step.with.tags).toContain('steps.tags.outputs.sha_tag');
      expect(step.with.tags).toContain('steps.tags.outputs.latest_tag');
    }
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
});

describe('ci-image.yml "semantic-release" job (release-only publish path)', () => {
  const job = workflow.jobs['semantic-release'];
  const steps = findSteps(job);
  it('is release-only and serializes the event-controlled tag', () => {
    expect(job.if).toContain("github.event_name == 'release'");
    expect(job.concurrency.group).toContain('github.event.release.tag_name');
  });
  it('authorizes checkout before setup or repository lifecycle execution', () => {
    const authorization = stepIndex(job, (step) => step.id === 'revision');
    expect(authorization).toBeLessThan(
      stepIndex(job, (step) => step.uses?.startsWith('actions/setup-node'))
    );
    expect(JSON.stringify(job)).not.toContain('pnpm install');
    const checkout = findStepsUsing(job, 'actions/checkout')[0];
    expect(checkout.with['persist-credentials']).toBe(false);
  });
  it('uses the reusable gate before and after one exact alias operation, with no rebuild', () => {
    const gates = steps.filter((step) =>
      step.run?.includes('check-release-consistency.mjs')
    );
    expect(gates).toHaveLength(2);
    const aliases = steps.filter((step) =>
      step.run?.includes('docker buildx imagetools create')
    );
    expect(aliases).toHaveLength(1);
    expect(stepIndex(job, (step) => step === gates[0])).toBeLessThan(
      stepIndex(job, (step) => step === aliases[0])
    );
    expect(stepIndex(job, (step) => step === aliases[0])).toBeLessThan(
      stepIndex(job, (step) => step === gates[1])
    );
    expect(findStepsUsing(job, 'docker/build-push-action')).toHaveLength(0);
  });
  it('revalidates absence immediately before the mutation', () => {
    const alias = stepIndex(job, (step) =>
      step.run?.includes('imagetools create')
    );
    expect(steps[alias - 1].run).toContain('ghcr-manifest.mjs check-absent');
  });
  it('uploads a deterministic manifest with an immutable pinned action and summarizes all digests', () => {
    const upload = findStepsUsing(job, 'actions/upload-artifact')[0];
    expect(upload.uses).toMatch(/@[0-9a-f]{40}$/);
    expect(upload.with.name).toBe('dspace-release-manifest');
    expect(upload.with.path).toBe('dspace-release-manifest.json');
    const summary = steps.find((step) =>
      step.run?.includes('GITHUB_STEP_SUMMARY')
    ).run;
    for (const field of [
      'sourceRevision',
      'imageDigest',
      'linux/amd64',
      'linux/arm64',
      'chartDigest',
    ])
      expect(summary).toContain(field);
  });
  it('passes event tag and credentials as environment data', () => {
    for (const step of steps.filter((step) => typeof step.run === 'string')) {
      expect(step.run).not.toContain('${{ github.event.release.tag_name }}');
      expect(step.run).not.toContain('${{ secrets.GITHUB_TOKEN }}');
    }
  });
});
