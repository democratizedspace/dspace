import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const repoRoot = path.resolve(__dirname, '..');
const readWorkflow = (filename: string) =>
  parse(
    readFileSync(path.join(repoRoot, '.github/workflows', filename), 'utf8')
  );
const readJobs = (filename: string) => readWorkflow(filename).jobs;

const aggregateCommands = [
  'npm run lint',
  'npm run type-check',
  'npm run build',
  'npm test',
  'node scripts/link-check.mjs',
];
const shardCommand =
  'npx playwright test --shard=${{ matrix.shard }} --reporter=dot';
const indexedDbCommand =
  'npx playwright test e2e/indexeddb-availability.spec.ts --project=chromium --reporter=dot';
const browserInstallCommand =
  'sudo env "PATH=$PATH" pnpm --dir frontend exec playwright install --with-deps chromium chromium-headless-shell firefox webkit';

function assertBrowserCoverage(job) {
  expect(job['runs-on']).toBe('ubuntu-24.04');
  expect(job.strategy.matrix.shard).toEqual(['1/2', '2/2']);
  expect(job.strategy.matrix.exclude).toBeUndefined();
  const install = job.steps.find(
    (step) => step.run?.trim() === browserInstallCommand
  );
  expect(install).toBeDefined();
  expect(install.if).toBeUndefined();
  expect(install['continue-on-error'] ?? false).toBe(false);
}

// Intentionally constrain these launch steps to their reviewed commands. Substring
// checks also accept commented commands, echo, project filters and `|| true`.
function assertLaunchGate(workflow, jobId: string, commands: string[]) {
  const job = workflow.jobs[jobId];
  expect(job, jobId).toBeDefined();
  for (const scope of [workflow, job, ...job.steps]) {
    expect(scope.env ?? {}).not.toHaveProperty('SKIP_E2E');
    if (jobId === 'root-tests') {
      expect(scope.env ?? {}).not.toHaveProperty('CI_COVERAGE_DONE');
    }
    expect(scope['continue-on-error'] ?? false).toBe(false);
  }
  for (const shell of [
    workflow.defaults?.run?.shell,
    job.defaults?.run?.shell,
  ]) {
    expect(shell === undefined || shell === 'bash').toBe(true);
  }
  expect(job.if).toBeUndefined();
  expect(job['working-directory']).toBeUndefined();
  expect(workflow.defaults?.run?.['working-directory']).toBeUndefined();
  expect(job.defaults?.run?.['working-directory']).toBeUndefined();
  for (const step of job.steps) {
    expect(step.run ?? '').not.toMatch(/\bSKIP_E2E\b/);
    if (jobId === 'root-tests') {
      expect(step.run ?? '').not.toMatch(/\bCI_COVERAGE_DONE\b/);
    }
  }
  const launch = job.steps.find(
    (step) => step.run?.trim() === commands.join('\n')
  );
  expect(
    launch,
    `${jobId} must execute the complete launch command`
  ).toBeDefined();
  expect(launch.if).toBeUndefined();
  expect(launch.shell === undefined || launch.shell === 'bash').toBe(true);
  expect(launch['working-directory']).toBe(
    jobId === 'root-tests' ? undefined : 'frontend'
  );
}

describe('required aggregate and browser launch gates', () => {
  const gates = [
    ['ci.yml', 'root-tests', aggregateCommands],
    ['ci.yml', 'frontend-indexeddb-regression-e2e', [indexedDbCommand]],
    ['tests.yml', 'e2e', [shardCommand]],
  ] as const;

  it.each(gates)(
    '%s / %s executes its required commands without skips or soft failures',
    (file, job, commands) => {
      assertLaunchGate(readWorkflow(file), job, [...commands]);
    }
  );

  for (const [file, jobId, commands] of gates) {
    const mutations = {
      'workflow skip flag': (workflow, job, launch) => {
        workflow.env = { SKIP_E2E: '1' };
      },
      'job skip flag': (workflow, job, launch) => {
        job.env = { SKIP_E2E: '1' };
      },
      'step skip flag': (workflow, job, launch) => {
        launch.env = { SKIP_E2E: '1' };
      },
      'inline skip flag': (workflow, job, launch) => {
        launch.run = `SKIP_E2E=1 ${launch.run}`;
      },
      'job soft failure': (workflow, job, launch) => {
        job['continue-on-error'] = true;
      },
      'step soft failure': (workflow, job, launch) => {
        launch['continue-on-error'] = true;
      },
      'conditional job': (workflow, job, launch) => {
        job.if = false;
      },
      'conditional launch': (workflow, job, launch) => {
        launch.if = false;
      },
      'removed launch': (workflow, job, launch) => {
        job.steps = job.steps.filter((step) => step !== launch);
      },
      'commented launch': (workflow, job, launch) => {
        launch.run = `# ${launch.run}`;
      },
      'masked exit code': (workflow, job, launch) => {
        launch.run += ' || true';
      },
      'non-fail-fast shell': (workflow, job, launch) => {
        launch.shell = 'bash {0}';
      },
      'non-fail-fast job shell': (workflow, job, launch) => {
        job.defaults = { run: { shell: 'bash {0}' } };
      },
      'non-fail-fast workflow shell': (workflow, job, launch) => {
        workflow.defaults = { run: { shell: 'bash {0}' } };
      },
      'wrong working directory': (workflow, job, launch) => {
        launch['working-directory'] = 'elsewhere';
      },
    };
    it.each(Object.entries(mutations))(
      `${jobId} rejects %s`,
      (_label, mutate) => {
        const workflow = readWorkflow(file);
        const job = workflow.jobs[jobId];
        const launch = job.steps.find(
          (step) => step.run?.trim() === commands.join('\n')
        );
        expect(launch).toBeDefined();
        mutate(workflow, job, launch);
        expect(() =>
          assertLaunchGate(workflow, jobId, [...commands])
        ).toThrow();
      }
    );
  }

  it.each(['workflow', 'job', 'step', 'inline'])(
    'rejects an unearned coverage skip at %s scope',
    (scope) => {
      const workflow = readWorkflow('ci.yml');
      const job = workflow.jobs['root-tests'];
      const launch = job.steps.find(
        (step) => step.run?.trim() === aggregateCommands.join('\n')
      );
      if (scope === 'inline') launch.run = `CI_COVERAGE_DONE=1 ${launch.run}`;
      else {
        const target =
          scope === 'workflow' ? workflow : scope === 'job' ? job : launch;
        target.env = { ...target.env, CI_COVERAGE_DONE: '1' };
      }
      expect(() =>
        assertLaunchGate(workflow, 'root-tests', aggregateCommands)
      ).toThrow();
    }
  );

  it.each(aggregateCommands)(
    'rejects removal of aggregate command %s',
    (command) => {
      const workflow = readWorkflow('ci.yml');
      const launch = workflow.jobs['root-tests'].steps.find(
        (step) => step.run?.trim() === aggregateCommands.join('\n')
      );
      launch.run = aggregateCommands
        .filter((entry) => entry !== command)
        .join('\n');
      expect(() =>
        assertLaunchGate(workflow, 'root-tests', aggregateCommands)
      ).toThrow();
    }
  );

  it.each([' --project=chromium', ' --grep=smoke', ' --list'])(
    'rejects altering full-shard selection%s',
    (filter) => {
      const workflow = readWorkflow('tests.yml');
      const launch = workflow.jobs.e2e.steps.find(
        (step) => step.run === shardCommand
      );
      launch.run += filter;
      expect(() => assertLaunchGate(workflow, 'e2e', [shardCommand])).toThrow();
    }
  );
});

describe('PR browser validation admission', () => {
  function assertAdmission(workflow, file: string) {
    expect(workflow.on).toEqual({
      push: { branches: ['v3', 'main'] },
      pull_request: file === 'ci.yml' ? { branches: ['v3', 'main'] } : null,
    });
  }
  for (const file of ['ci.yml', 'tests.yml']) {
    it(`${file} retains unfiltered PR and protected branch validation`, () => {
      assertAdmission(readWorkflow(file), file);
    });
    it(`${file} rejects missing PR triggers and path-filtered validation`, () => {
      const missing = readWorkflow(file);
      delete missing.on.pull_request;
      expect(() => assertAdmission(missing, file)).toThrow();
      const filtered = readWorkflow(file);
      filtered.on.pull_request = {
        ...filtered.on.pull_request,
        paths: ['docs/**'],
      };
      expect(() => assertAdmission(filtered, file)).toThrow();
    });
  }
});

function assertIndexedDbInstall(job) {
  const install = job.steps.find(
    (step) =>
      step.run === 'pnpm --dir frontend exec playwright install chromium'
  );
  expect(install).toBeDefined();
  expect(install.if).toBeUndefined();
  expect(install['continue-on-error'] ?? false).toBe(false);
}

describe('locked Playwright runner compatibility', () => {
  it('pins the IndexedDB browser job to supported Ubuntu 24.04', () => {
    const job = readJobs('ci.yml')['frontend-indexeddb-regression-e2e'];
    expect(job['runs-on']).toBe('ubuntu-24.04');
    assertIndexedDbInstall(job);
    expect(
      job.steps.some((step: { run?: string }) =>
        step.run?.includes('e2e/indexeddb-availability.spec.ts')
      )
    ).toBe(true);
  });

  it('rejects removal of the IndexedDB browser install', () => {
    const job = readJobs('ci.yml')['frontend-indexeddb-regression-e2e'];
    job.steps = job.steps.filter(
      (step) =>
        step.run !== 'pnpm --dir frontend exec playwright install chromium'
    );
    expect(() => assertIndexedDbInstall(job)).toThrow();
  });

  it('pins both full browser shards without reducing browser coverage', () => {
    const job = readJobs('tests.yml').e2e;
    assertBrowserCoverage(job);
  });

  it.each(['chromium', 'chromium-headless-shell', 'firefox', 'webkit'])(
    'rejects omission of the %s browser install',
    (browser) => {
      const job = readJobs('tests.yml').e2e;
      const install = job.steps.find(
        (step) => step.run === browserInstallCommand
      );
      install.run = install.run
        .split(' ')
        .filter((word) => word !== browser)
        .join(' ');
      expect(() => assertBrowserCoverage(job)).toThrow();
    }
  );

  it.each(['1/2', '2/2'])(
    'rejects removal or exclusion of shard %s',
    (shard) => {
      const job = readJobs('tests.yml').e2e;
      job.strategy.matrix.shard = job.strategy.matrix.shard.filter(
        (entry) => entry !== shard
      );
      expect(() => assertBrowserCoverage(job)).toThrow();
      job.strategy.matrix.shard = ['1/2', '2/2'];
      job.strategy.matrix.exclude = [{ shard }];
      expect(() => assertBrowserCoverage(job)).toThrow();
    }
  );
});

describe('explicit Ubuntu runner policy', () => {
  const workflowFiles = readdirSync(
    path.join(repoRoot, '.github/workflows')
  ).filter((filename) => /\.ya?ml$/.test(filename));

  it.each(workflowFiles)(
    '%s does not use the rolling Ubuntu image',
    (filename) => {
      const source = readFileSync(
        path.join(repoRoot, '.github/workflows', filename),
        'utf8'
      );
      expect(source).not.toContain('ubuntu-latest');
      for (const job of Object.values(readJobs(filename)) as Array<{
        'runs-on'?: string | string[];
      }>) {
        const runners = Array.isArray(job['runs-on'])
          ? job['runs-on']
          : [job['runs-on']];
        for (const runner of runners) {
          if (typeof runner === 'string' && runner.startsWith('ubuntu-')) {
            expect(runner).toMatch(/^ubuntu-\d{2}\.\d{2}(?:-arm)?$/);
          }
        }
      }
    }
  );
});

describe('remote QA entry points and report paths', () => {
  it.each([
    ['remote-migration', 'run-remote-migration.mjs'],
    [
      'remote-completionist-award-iii',
      'run-remote-completionist-award-iii.mjs',
    ],
  ])('retains %s without launching a remote target', (name, script) => {
    const pkg = JSON.parse(
      readFileSync(path.join(repoRoot, 'package.json'), 'utf8')
    );
    expect(pkg.scripts[`qa:${name}`]).toBe(
      `npx -y node@24.22.3 scripts/${script}`
    );
    const source = readFileSync(path.join(repoRoot, 'scripts', script), 'utf8');
    expect(source).toContain(`test-results/${name}-harness-report.json`);
  });
});
