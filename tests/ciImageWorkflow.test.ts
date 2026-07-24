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

  it('exists and is gated on a published release, not an ordinary push', () => {
    expect(job).toBeTruthy();
    expect(job.if).toBe(
      "github.event_name == 'release' && github.event.action == 'published'"
    );
  });

  it('serializes semantic publication with a concurrency group keyed on the tag', () => {
    expect(job.concurrency).toBeTruthy();
    expect(job.concurrency.group).toContain('github.event.release.tag_name');
    expect(job.concurrency['cancel-in-progress']).toBe(false);
  });

  it('checks out the tagged commit explicitly rather than trusting the default ref', () => {
    const checkoutStep = findStepsUsing(job, 'actions/checkout')[0];
    expect(checkoutStep.with.ref).toContain('github.event.release.tag_name');
  });

  it('uses the checked-out git rev-parse HEAD as the source revision, never github.sha', () => {
    const serialized = JSON.stringify(job);
    expect(serialized).toMatch(/git rev-parse HEAD/);
    expect(serialized).not.toContain('${{ github.sha }}');
  });

  it('peels the release tag to its commit before comparing to HEAD', () => {
    // "git rev-parse <tag>" alone resolves an annotated/signed tag's own object SHA, not
    // the commit it points at, which would reject every legitimate release cut from such a
    // tag even though checkout correctly left HEAD on the tagged commit. The "^{commit}"
    // peeling suffix is required so both lightweight and annotated/signed tags compare
    // correctly against HEAD.
    const revisionStep = findSteps(job).find((step) => step.id === 'revision');
    expect(revisionStep.run).toMatch(/\$\{RELEASE_TAG\}\^\{commit\}|\$RELEASE_TAG\^\{commit\}/);
  });

  it('never interpolates the attacker-influenceable release tag directly into a shell script', () => {
    // Git tag names can contain shell metacharacters ("`, $(), ;). GitHub substitutes
    // ${{ }} expressions into a run: script's source text before the shell parses it, so
    // interpolating the raw tag there would let a crafted release tag execute commands with
    // this job's packages:write/actions:write token. The tag may only reach a `run:` step by
    // way of an `env:` var (assigned as data, not concatenated into the script) — never as a
    // literal ${{ github.event.release.tag_name }} expression inside `run:` text. Using it as
    // a structured action input (checkout's `ref:`, `concurrency.group`) is fine, since those
    // aren't shell-interpolation contexts.
    for (const step of findSteps(job)) {
      if (typeof step.run !== 'string') {
        continue;
      }
      expect(step.run).not.toContain('${{ github.event.release.tag_name }}');
      if (step.run.includes('RELEASE_TAG')) {
        expect(step.env?.RELEASE_TAG).toBe(
          '${{ github.event.release.tag_name }}'
        );
      }
    }
  });

  it('validates the release tag against v<root package version> before any push', () => {
    const versionStep = findSteps(job).find((step) => step.id === 'version');
    expect(versionStep.run).toMatch(/root_version/);
    expect(versionStep.run).toMatch(/frontend_version/);
    expect(versionStep.run).toMatch(/expected_tag="v\$\{root_version\}"/);
    expect(versionStep.run).toMatch(/refusing to publish/);

    const pushIndex = stepIndex(
      job,
      (step) =>
        step.uses?.startsWith('docker/build-push-action') &&
        step.with?.push === true
    );
    const versionIndex = stepIndex(job, (step) => step.id === 'version');
    expect(versionIndex).toBeGreaterThanOrEqual(0);
    expect(versionIndex).toBeLessThan(pushIndex);
  });

  it('runs the semantic absence guard before publication, and fails closed', () => {
    const guardIndex = stepIndex(job, (step) =>
      step.run?.includes('ghcr-manifest.mjs check-absent')
    );
    const pushIndex = stepIndex(
      job,
      (step) =>
        step.uses?.startsWith('docker/build-push-action') &&
        step.with?.push === true
    );
    expect(guardIndex).toBeGreaterThanOrEqual(0);
    expect(pushIndex).toBeGreaterThan(guardIndex);
  });

  it('keeps multi-arch publication for both supported architectures', () => {
    const pushSteps = findStepsUsing(job, 'docker/build-push-action').filter(
      (step) => step.with?.push === true
    );
    expect(pushSteps.length).toBeGreaterThan(0);
    for (const step of pushSteps) {
      expect(step.with.platforms).toBe('linux/amd64,linux/arm64');
    }
  });

  it('contains exactly one semantic publication step that pushes only the semantic tag', () => {
    const pushSteps = findStepsUsing(job, 'docker/build-push-action').filter(
      (step) => step.with?.push === true
    );
    expect(pushSteps).toHaveLength(1);
    const [pushStep] = pushSteps;
    expect(pushStep.name).toBe('Build and push semantic release image');
    expect(pushStep.id).toBe('build_push');
    expect(pushStep.with.tags).toBe('${{ steps.tags.outputs.semantic_tag }}');
    expect(pushStep.with.tags).not.toContain('branch_sha_tag');
    expect(pushStep.with.tags).not.toMatch(/latest/);
    expect(pushStep['continue-on-error']).toBeUndefined();
  });

  it('has no second-attempt or retry path for semantic publication', () => {
    const serialized = JSON.stringify(job);
    expect(serialized).not.toMatch(/attempt 1|attempt 2|retry/i);
    expect(serialized).not.toContain('build_push_1');
    expect(serialized).not.toContain('build_push_2');
    expect(serialized).not.toMatch(/outcome == 'failure'/);
  });

  it('lets publication failure terminate the job without conditional recovery', () => {
    const pushStep = findStepsUsing(job, 'docker/build-push-action').find(
      (step) => step.with?.push === true
    );
    expect(pushStep).toBeTruthy();
    expect(pushStep.if).toBeUndefined();
    expect(pushStep['continue-on-error']).toBeUndefined();
    const laterSteps = findSteps(job).slice(
      findSteps(job).indexOf(pushStep) + 1
    );
    for (const step of laterSteps) {
      expect(step.if ?? '').not.toMatch(
        /failure\(\)|outcome == 'failure'|always\(\)/
      );
    }
  });

  it('verifies and summarizes the branch-SHA coordinate without pushing it', () => {
    const branchDescribeStep = findSteps(job).find(
      (step) => step.id === 'branch_sha_evidence'
    );
    expect(branchDescribeStep).toBeTruthy();
    expect(branchDescribeStep.run).toContain('ghcr-manifest.mjs describe');
    expect(branchDescribeStep.run).toContain('steps.branch.outputs.branch');
    expect(branchDescribeStep.run).toContain(
      'steps.revision.outputs.short_sha'
    );

    const pushSteps = findStepsUsing(job, 'docker/build-push-action').filter(
      (step) => step.with?.push === true
    );
    for (const step of pushSteps) {
      expect(JSON.stringify(step.with)).not.toContain('branch_sha_tag');
    }

    const summaryStep = findSteps(job).find((step) =>
      step.run?.includes('GITHUB_STEP_SUMMARY')
    );
    expect(summaryStep.run).toContain('steps.tags.outputs.branch_sha_tag');
  });

  it('records the required evidence in the workflow summary without leaking credentials', () => {
    const summaryStep = findSteps(job).find((step) =>
      step.run?.includes('GITHUB_STEP_SUMMARY')
    );
    expect(summaryStep).toBeTruthy();
    const summary = summaryStep.run as string;
    expect(summary).toMatch(/Semantic version/);
    expect(summary).toMatch(/Full Git SHA/);
    expect(summary).toMatch(/Immutable branch-SHA tag/);
    expect(summary).toMatch(/Semantic tag/);
    expect(summary).toMatch(/Image index digest/);
    expect(summary).toMatch(/linux\/amd64 digest/);
    expect(summary).toMatch(/linux\/arm64 digest/);
    expect(summary).not.toMatch(/GITHUB_TOKEN/);
    expect(summary).not.toMatch(/password/i);
  });

  it('passes registry credentials only through env, never inline in a run script', () => {
    const guardStep = findSteps(job).find((step) =>
      step.run?.includes('ghcr-manifest.mjs check-absent')
    );
    const evidenceStep = findSteps(job).find((step) =>
      step.run?.includes('ghcr-manifest.mjs describe')
    );
    for (const step of [guardStep, evidenceStep]) {
      expect(step.env.GHCR_GUARD_PASSWORD).toContain('secrets.GITHUB_TOKEN');
      expect(step.run).not.toContain('secrets.GITHUB_TOKEN');
    }
  });
});
