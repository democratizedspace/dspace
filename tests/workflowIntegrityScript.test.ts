import { describe, expect, it } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

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

describe('workflow integrity guard', () => {
  it('passes for current workflow configuration', () => {
    const output = execFileSync('node', ['scripts/check-workflows.mjs'], {
      cwd: repoRoot,
      encoding: 'utf8',
    });

    expect(output).toContain('Workflow integrity check passed');
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
});
