import { describe, expect, it } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

function withTempWorkflows(mutator: (workflowsDir: string) => void) {
  const tempRoot = mkdtempSync(join(tmpdir(), 'workflow-integrity-'));

  try {
    const githubDir = join(tempRoot, '.github');
    mkdirSync(githubDir, { recursive: true });
    cpSync(join(repoRoot, '.github', 'workflows'), join(githubDir, 'workflows'), { recursive: true });

    const workflowsDir = join(githubDir, 'workflows');

    mutator(workflowsDir);

    return spawnSync('node', ['scripts/check-workflows.mjs'], {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        WORKFLOWS_DIR: workflowsDir,
      },
    });
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
}

function readWorkflowEvents(workflowFile: string) {
  const workflowPath = join(repoRoot, '.github', 'workflows', workflowFile);
  const parsed = parse(readFileSync(workflowPath, 'utf8')) as { on?: Record<string, unknown> };
  return parsed.on ?? {};
}

describe('workflow integrity guard', () => {
  it('passes for current workflow configuration', () => {
    const output = execFileSync('node', ['scripts/check-workflows.mjs'], {
      cwd: repoRoot,
      encoding: 'utf8',
    });

    expect(output).toContain('Workflow integrity check passed');
  });

  it('keeps main PR coverage on workflows involved in this incident', () => {
    const ciEvents = readWorkflowEvents('ci.yml');
    expect(ciEvents.pull_request).toBeTruthy();
    expect((ciEvents.push as { branches?: string[] }).branches).toContain('main');
    expect((ciEvents.pull_request as { branches?: string[] }).branches).toContain('main');

    const testsEvents = readWorkflowEvents('tests.yml');
    expect(testsEvents.pull_request).not.toBeUndefined();
    expect(testsEvents.pull_request).not.toBe(false);
    expect((testsEvents.push as { branches?: string[] }).branches).toContain('main');

    const ciImageEvents = readWorkflowEvents('ci-image.yml');
    expect(ciImageEvents.pull_request).not.toBeUndefined();
    expect(ciImageEvents.pull_request).not.toBe(false);
    expect((ciImageEvents.pull_request as { branches?: string[] }).branches).toContain('main');

    const buildEvents = readWorkflowEvents('build.yml');
    expect(buildEvents.pull_request).toBeDefined();
  });

  it('fails when a required workflow is missing', () => {
    const result = withTempWorkflows((workflowsDir) => {
      rmSync(join(workflowsDir, 'build.yml'));
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('Missing required workflow: build.yml');
  });

  it('fails when a workflow pushes to main but excludes main on pull_request', () => {
    const result = withTempWorkflows((workflowsDir) => {
      writeFileSync(
        join(workflowsDir, 'ci.yml'),
        `name: ci
on:
  push:
    branches: [main]
  pull_request:
    branches: [v3]
jobs:
  checks:
    runs-on: ubuntu-latest
    steps:
      - run: echo ci
`,
        'utf8'
      );
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(
      'Workflow ci.yml pushes to main but pull_request.branches does not include main'
    );
  });

  it('treats unfiltered push triggers as including main', () => {
    const result = withTempWorkflows((workflowsDir) => {
      writeFileSync(
        join(workflowsDir, 'ci.yml'),
        `name: ci
on:
  push: {}
  pull_request:
    branches: [v3]
jobs:
  checks:
    runs-on: ubuntu-latest
    steps:
      - run: echo ci
`,
        'utf8'
      );
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(
      'Workflow ci.yml pushes to main but pull_request.branches does not include main'
    );
  });

  it('fails when ci.yml is missing a required launch-gate command', () => {
    const result = withTempWorkflows((workflowsDir) => {
      const ciPath = join(workflowsDir, 'ci.yml');
      const ciContents = readFileSync(ciPath, 'utf8');
      writeFileSync(
        ciPath,
        ciContents.replace('node scripts/link-check.mjs', 'echo "link check skipped"'),
        'utf8'
      );
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(
      'Workflow ci.yml root-tests launch-gate script must include link-check; expected one of: node scripts/link-check.mjs'
    );
  });

  it('fails when bare test command is replaced with scoped test command', () => {
    const result = withTempWorkflows((workflowsDir) => {
      const ciPath = join(workflowsDir, 'ci.yml');
      const ciContents = readFileSync(ciPath, 'utf8');
      writeFileSync(ciPath, ciContents.replace('npm test', 'npm run test:root'), 'utf8');
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(
      'Workflow ci.yml root-tests launch-gate script must include test; expected one of: npm test'
    );
  });

  it('fails when launch-gate commands exist outside root-tests but not inside it', () => {
    const result = withTempWorkflows((workflowsDir) => {
      const ciPath = join(workflowsDir, 'ci.yml');
      const ciContents = readFileSync(ciPath, 'utf8');
      const mutated = ciContents
        .replace('npm run lint', 'echo "lint skipped"')
        .replace(
          '          output: lychee/out.md',
          '          output: lychee/out.md\n      - name: Non-root-tests lint\n        run: npm run lint'
        );
      writeFileSync(ciPath, mutated, 'utf8');
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(
      'Workflow ci.yml root-tests launch-gate script must include lint; expected one of: npm run lint'
    );
  });
});
