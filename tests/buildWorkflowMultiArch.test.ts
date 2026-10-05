import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

describe('build workflow multi-arch validation', () => {
  const workflowPath = join(repoRoot, '.github', 'workflows', 'build.yml');
  const contents = readFileSync(workflowPath, 'utf8');
  const workflow = parse(contents);
  const steps = workflow.jobs.build.steps;
  const builds = steps.filter((step) =>
    step.uses?.startsWith('docker/build-push-action@')
  );

  it('builds linux/amd64 and linux/arm64 images', () => {
    expect(builds).toHaveLength(1);
    expect(builds[0].with.platforms).toBe('linux/amd64,linux/arm64');
    expect(workflow.on.push.branches).toEqual(['main', 'codex/**']);
    expect(workflow.on.push.tags).toEqual(['v*']);
    expect(workflow.on).toHaveProperty('pull_request');
    expect(workflow.on).toHaveProperty('workflow_dispatch');
  });

  it('cannot publish images or export registry cache on any trigger', () => {
    expect(workflow.permissions).toEqual({ contents: 'read' });
    for (const job of Object.values(workflow.jobs) as any[]) {
      expect(job.permissions).toBeUndefined();
    }
    expect(
      steps.some((step) => step.uses?.startsWith('docker/login-action@'))
    ).toBe(false);
    for (const build of builds) {
      expect(build.with.push).toBe(false);
      expect(build.with.outputs).toBeUndefined();
      expect(build.with['cache-to']).toBeUndefined();
    }
    expect(contents).not.toMatch(
      /docker\s+(?:push|buildx\s+imagetools\s+create)/
    );
  });

  it('keeps image-pushing build actions exclusively in the canonical image job', () => {
    const directory = join(repoRoot, '.github', 'workflows');
    const publishers: string[] = [];
    for (const filename of readdirSync(directory).filter((name) =>
      /\.ya?ml$/.test(name)
    )) {
      const candidate = parse(readFileSync(join(directory, filename), 'utf8'));
      for (const [jobName, job] of Object.entries(candidate.jobs) as [
        string,
        any,
      ][]) {
        for (const step of job.steps ?? []) {
          if (
            step.uses?.startsWith('docker/build-push-action@') &&
            step.with?.push !== false
          ) {
            publishers.push(`${filename}:${jobName}`);
          }
        }
      }
    }
    // Retries may add steps, but only the canonical branch-image job may push.
    expect(new Set(publishers)).toEqual(new Set(['ci-image.yml:image']));
  });
});
