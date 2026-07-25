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

describe('ci-image.yml semantic release consistency gate', () => {
  const job = workflow.jobs['semantic-release'];
  const steps = findSteps(job);

  it('is release-only and serializes each semantic coordinate', () => {
    expect(job.if).toContain("github.event_name == 'release'");
    expect(job.concurrency.group).toContain('github.event.release.tag_name');
    expect(job.concurrency['cancel-in-progress']).toBe(false);
  });

  it('authorizes source before setup or lifecycle execution and does not persist credentials', () => {
    const checkout = findStepsUsing(job, 'actions/checkout')[0];
    expect(checkout.with.ref).toContain('github.event.release.tag_name');
    expect(checkout.with['persist-credentials']).toBe(false);
    const authorization = steps.findIndex((step) =>
      step.name.includes('Authorize source')
    );
    const setup = steps.findIndex(
      (step) =>
        step.uses?.includes('setup-node') || step.run?.includes('pnpm install')
    );
    expect(authorization).toBeGreaterThan(0);
    expect(setup === -1 || authorization < setup).toBe(true);
    expect(steps[authorization].run).toContain(
      'check-release-consistency.mjs local'
    );
    expect(steps[authorization].run).toContain('git rev-parse HEAD');
    expect(steps[authorization].run).not.toContain(
      '${{ github.event.release.tag_name }}'
    );
  });

  it('verifies prerequisites, rechecks absence, and performs one alias without rebuilding', () => {
    const serialized = JSON.stringify(job);
    expect(serialized).toContain('check-release-consistency.mjs full');
    expect(serialized.match(/check-absent/g)).toHaveLength(1);
    const aliases = steps.filter((step) =>
      step.run?.includes('docker buildx imagetools create')
    );
    expect(aliases).toHaveLength(1);
    expect(aliases[0].run).toContain('SOURCE_BRANCH');
    expect(aliases[0].run).toContain('RELEASE_TAG');
    expect(findStepsUsing(job, 'docker/build-push-action')).toHaveLength(0);
    expect(serialized).not.toContain('docker/build-push-action');
    expect(serialized).not.toMatch(/push:\s*true/);
  });

  it('verifies digest equality, validates, uploads, and summarizes the manifest', () => {
    const evidence = steps.find((step) =>
      step.name.includes('Verify digest equality')
    );
    expect(evidence.run).toContain('--semantic-state present');
    expect(evidence.run).toContain('--output "$file"');
    expect(evidence.run).toContain('validate-manifest');
    for (const field of [
      'Full source SHA',
      'Immutable image',
      'Image index digest',
      'linux/amd64 digest',
      'linux/arm64 digest',
      'Immutable chart',
    ])
      expect(evidence.run).toContain(field);
    const upload = findStepsUsing(job, 'actions/upload-artifact')[0];
    expect(upload.uses).toMatch(/@[0-9a-f]{40}$/);
    expect(upload.with.name).toBe('dspace-release-manifest');
    expect(upload.with.path).toBe('dspace-release-manifest.json');
  });

  it('keeps event strings and credentials out of shell source', () => {
    for (const step of steps) {
      if (!step.run) continue;
      expect(step.run).not.toContain('${{ github.event.release.tag_name }}');
      expect(step.run).not.toContain('secrets.GITHUB_TOKEN');
      if (step.run.includes('RELEASE_TAG'))
        expect(step.env.RELEASE_TAG).toBe(
          '${{ github.event.release.tag_name }}'
        );
    }
  });
});
