import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

type Step = { uses?: string; run?: string; with?: Record<string, unknown> };
type Workflow = { jobs: Record<string, { steps?: Step[] }> };

function publishesExporter(value: string, cache = false): boolean {
  return value
    .split(/\r?\n/)
    .some(
      (exporter) =>
        (cache && /^[^\s,=]+$/.test(exporter.trim())) ||
        /\btype\s*=\s*registry\b/.test(exporter) ||
        (/\btype\s*=\s*image\b/.test(exporter) &&
          /(?:^|,)\s*push(?:-by-digest)?\s*=\s*true\b/.test(exporter))
    );
}

function imagePublishers(filename: string, workflow: Workflow): string[] {
  const publishers: string[] = [];
  for (const [jobName, job] of Object.entries(workflow.jobs)) {
    for (const step of job.steps ?? []) {
      const buildAction = step.uses?.startsWith('docker/build-push-action@');
      const registryExport = ['outputs', 'cache-to'].some((input) =>
        publishesExporter(
          String(step.with?.[input] ?? ''),
          input === 'cache-to'
        )
      );
      const shell = (step.run ?? '')
        .split('\n')
        .filter((line) => !line.trim().startsWith('#'))
        .join('\n');
      const shellPublish =
        /crane\s+(?:push|tag|copy)\b/.test(shell) ||
        /docker\s+(?:(?:(?:image|manifest)\s+)?push\b|buildx\s+imagetools\s+create\b)/.test(
          shell
        ) ||
        (/docker\s+(?:build\b|buildx\s+(?:build|bake)\b)/.test(shell) &&
          (/--push(?:=true)?(?=\s|$)/.test(shell) ||
            Array.from(
              shell.matchAll(
                /(--output|--cache-to|-o|--set)(?:=|\s+)(?:"([^"]*)"|'([^']*)'|([^\s]+))/g
              )
            ).some((match) => {
              const value = match[2] ?? match[3] ?? match[4];
              // Bake --set exports use target.output/cache-to, including append overrides.
              if (match[1] === '--set') {
                const override = value.match(/^.+\.(output|cache-to)\+?=(.*)$/);
                return (
                  !!override &&
                  publishesExporter(override[2], override[1] === 'cache-to')
                );
              }
              return publishesExporter(value, match[1] === '--cache-to');
            })));
      if (
        (buildAction && (step.with?.push !== false || registryExport)) ||
        shellPublish
      ) {
        publishers.push(`${filename}:${jobName}`);
      }
    }
  }
  return publishers;
}

describe('build workflow multi-arch validation', () => {
  const workflowPath = join(repoRoot, '.github', 'workflows', 'build.yml');
  const contents = readFileSync(workflowPath, 'utf8');
  const workflow = parse(contents);
  const amd64 = workflow.jobs['native-amd64'];
  const arm64 = workflow.jobs['native-arm64'];
  const gate = workflow.jobs.build;
  const nativeJobs = [amd64, arm64];
  const steps = [...amd64.steps, ...arm64.steps, ...gate.steps];
  const builds = steps.filter((step: Step) =>
    step.uses?.startsWith('docker/build-push-action@')
  );

  it('validates both native architectures in parallel on every existing trigger', () => {
    expect(workflow.name).toBe('Validate Container Build');
    expect(workflow.on).toEqual({
      push: { branches: ['main', 'codex/**'], tags: ['v*'] },
      pull_request: null,
      workflow_dispatch: null,
    });
    expect(workflow.concurrency).toBeUndefined();
    expect(amd64['runs-on']).toBe('ubuntu-24.04');
    expect(amd64.env).toEqual({ VALIDATION_PLATFORM: 'linux/amd64' });
    expect(arm64['runs-on']).toBe('ubuntu-24.04-arm');
    expect(arm64.env).toEqual({ VALIDATION_PLATFORM: 'linux/arm64' });
    for (const job of nativeJobs) {
      expect(job.needs).toBeUndefined();
      expect(job.if).toBeUndefined();
      expect(job.strategy).toBeUndefined();
      expect(job['timeout-minutes']).toBe(45);
      expect(job['continue-on-error']).toBeUndefined();
      expect(
        job.steps.filter((step: Step) =>
          step.uses?.startsWith('docker/build-push-action@')
        )
      ).toHaveLength(1);
      for (const step of job.steps) {
        expect(step.if).toBeUndefined();
        expect(step['continue-on-error']).toBeUndefined();
      }
    }
    expect(builds).toHaveLength(2);
    expect(
      steps.some((step) => step.uses?.startsWith('docker/setup-qemu-action@'))
    ).toBe(false);
    for (const build of builds) {
      expect(build.with.platforms).toBe('${{ env.VALIDATION_PLATFORM }}');
      expect(build.with.file).toBe('Dockerfile');
      expect(build.with.context).toBe('.');
      expect(build.with['build-args']).toBe(
        'GIT_SHA=${{ github.sha }}\nVITE_GIT_SHA=${{ github.sha }}\nENFORCE_VITE_GIT_SHA=1\n'
      );
    }
  });

  it('preserves the required check identity and always evaluates both job results', () => {
    expect(Object.keys(workflow.jobs).sort()).toEqual([
      'build',
      'native-amd64',
      'native-arm64',
    ]);
    expect(gate.name).toBe('Build multi-arch image');
    expect(gate.needs).toEqual(['native-amd64', 'native-arm64']);
    expect(gate.if).toBe('${{ always() }}');
    expect(gate['continue-on-error']).toBeUndefined();
    expect(gate.steps).toHaveLength(1);
    expect(gate.steps[0].if).toBeUndefined();
    expect(gate.steps[0]['continue-on-error']).toBeUndefined();
    expect(gate.steps[0].env).toEqual({
      AMD64_RESULT: '${{ needs.native-amd64.result }}',
      ARM64_RESULT: '${{ needs.native-arm64.result }}',
    });
  });

  const possibleResults = ['success', 'failure', 'cancelled', 'skipped', ''];
  it.each(
    possibleResults.flatMap((amd64Result) =>
      possibleResults.map((arm64Result) => [amd64Result, arm64Result])
    )
  )(
    'aggregate fails closed for amd64=%j arm64=%j',
    (amd64Result, arm64Result) => {
      const result = spawnSync('bash', ['-c', gate.steps[0].run], {
        env: {
          ...process.env,
          AMD64_RESULT: amd64Result,
          ARM64_RESULT: arm64Result,
        },
        encoding: 'utf8',
      });
      expect(result.error).toBeUndefined();
      expect(result.status).toBe(
        amd64Result === 'success' && arm64Result === 'success' ? 0 : 1
      );
    }
  );

  it.each([
    ['linux/amd64', 'X64', 'linux/amd64', 0],
    ['linux/arm64', 'ARM64', 'linux/arm64', 0],
    ['linux/arm64', 'X64', 'linux/arm64', 1],
    ['linux/arm64', 'ARM64', 'linux/amd64', 1],
  ])(
    'asserts native runner and Docker engine for %s %s %s',
    (platform, runnerArch, dockerPlatform, status) => {
      const stepsForPlatform =
        platform === 'linux/amd64' ? amd64.steps : arm64.steps;
      const checkIndex = stepsForPlatform.findIndex(
        (step: { name?: string }) =>
          step.name === 'Confirm native runner and Docker engine'
      );
      const buildIndex = stepsForPlatform.findIndex((step: Step) =>
        step.uses?.startsWith('docker/build-push-action@')
      );
      expect(checkIndex).toBeGreaterThanOrEqual(0);
      expect(checkIndex).toBeLessThan(buildIndex);
      const check = stepsForPlatform[checkIndex];
      const result = spawnSync(
        'bash',
        [
          '-c',
          'docker() { printf "%s\\n" "$FIXTURE_DOCKER_PLATFORM"; }\n' +
            check.run,
        ],
        {
          env: {
            ...process.env,
            VALIDATION_PLATFORM: platform,
            RUNNER_ARCH: runnerArch,
            FIXTURE_DOCKER_PLATFORM: dockerPlatform,
          },
          encoding: 'utf8',
        }
      );
      expect(result.error).toBeUndefined();
      expect(result.status).toBe(status);
    }
  );

  it('cannot publish images or export registry cache on any trigger', () => {
    expect(workflow.permissions).toEqual({ contents: 'read' });
    for (const job of nativeJobs) {
      expect(job.permissions).toBeUndefined();
      const checkout = job.steps.find((step: Step) =>
        step.uses?.startsWith('actions/checkout@')
      );
      expect(checkout.with['persist-credentials']).toBe(false);
    }
    expect(gate.permissions).toEqual({});
    expect(
      steps.some((step) => step.uses?.startsWith('docker/login-action@'))
    ).toBe(false);
    for (const build of builds) {
      expect(build.with.push).toBe(false);
      expect(build.with.outputs).toBeUndefined();
      expect(build.with['cache-to']).toBeUndefined();
      expect(build.with['cache-from']).toBeUndefined();
    }
  });

  it('keeps image publishing and registry exports in the canonical publication jobs', () => {
    const directory = join(repoRoot, '.github', 'workflows');
    const publishers: string[] = [];
    for (const filename of readdirSync(directory).filter((name) =>
      /\.ya?ml$/.test(name)
    )) {
      const candidate = parse(
        readFileSync(join(directory, filename), 'utf8')
      ) as Workflow;
      publishers.push(...imagePublishers(filename, candidate));
    }
    // The release job aliases an existing image; only these two jobs may mutate image coordinates.
    expect(new Set(publishers)).toEqual(
      new Set(['ci-image.yml:image', 'ci-image.yml:semantic-release'])
    );
  });

  it.each<Step>([
    { run: 'docker push ghcr.io/example/image:tag' },
    { run: 'crane push --index ./layout ghcr.io/example/image:tag' },
    { run: 'crane tag ghcr.io/example/image@sha256:digest latest' },
    { run: 'docker image push ghcr.io/example/image:tag' },
    { run: 'docker manifest push ghcr.io/example/image:tag' },
    {
      run: 'docker buildx imagetools create --tag ghcr.io/example/image:tag source@sha256:abc',
    },
    { run: 'docker buildx build --platform linux/amd64 --push .' },
    { run: 'docker buildx build --cache-to=user/app:cache .' },
    { run: 'docker buildx build --cache-to user/app:cache .' },
    { run: 'docker buildx bake --set *.cache-to=user/app:cache' },
    {
      uses: 'docker/build-push-action@v6',
      with: { push: false, 'cache-to': 'user/app:cache' },
    },
    {
      uses: 'docker/build-push-action@v6',
      with: {
        push: false,
        'cache-to': 'type=local,dest=.cache\nuser/app:cache',
      },
    },
    { run: 'docker buildx bake --push' },
    { run: 'docker buildx bake --set *.output=type=registry' },
    { run: 'docker buildx bake --set="app.output=type=image,push=true"' },
    {
      run: "docker buildx bake --set 'app.output=type=image,push-by-digest=true'",
    },
    {
      run: 'docker buildx bake --set=*.cache-to=type=registry,ref=example/cache',
    },
    {
      run: 'docker buildx bake --set "app.cache-to+=type=registry,ref=example/cache"',
    },
    { run: 'docker buildx build --output type=registry .' },
    { run: 'docker buildx build --output="type=registry" .' },
    { run: 'docker buildx build -o type=registry .' },
    {
      run: 'docker buildx build --cache-to type=registry,ref=ghcr.io/example/cache .',
    },
    {
      run: 'docker buildx build --cache-to=type=registry,ref=ghcr.io/example/cache .',
    },
    { run: 'docker build --output type=registry .' },
    {
      run: 'docker buildx build --output type=image,name=example/image,push=true .',
    },
    { run: 'docker buildx build --output="type=image,push-by-digest=true" .' },
    {
      uses: 'docker/build-push-action@v6',
      with: { push: false, outputs: 'type=image,name=example/image,push=true' },
    },
    {
      uses: 'docker/build-push-action@v6',
      with: { push: false, outputs: 'type=image,push-by-digest=true' },
    },
    {
      uses: 'docker/build-push-action@v6',
      with: {
        push: false,
        'cache-to': 'type=registry,ref=ghcr.io/example/cache',
      },
    },
    {
      uses: 'docker/build-push-action@v6',
      with: { push: false, outputs: 'type=registry' },
    },
  ])('detects alternate publication even outside build.yml: %j', (step) => {
    expect(
      imagePublishers('other.yml', { jobs: { validation: { steps: [step] } } })
    ).toEqual(['other.yml:validation']);
  });

  it.each<Step>([
    { run: 'docker buildx bake --load --set *.output=type=docker' },
    {
      run: 'docker buildx build --cache-to=type=local,dest=.cache --output dist .',
    },
    {
      run: 'docker buildx bake --set *.output=dist --set *.cache-to=type=local,dest=.cache',
    },
    {
      uses: 'docker/build-push-action@v6',
      with: {
        push: false,
        'cache-to': 'type=local,dest=.cache',
        outputs: 'dist',
      },
    },
    { run: 'docker buildx bake --push=false' },
    { run: 'docker buildx bake --set *.args.EXAMPLE=type=registry' },
    {
      run: 'docker buildx build --output type=image,name=example/image,push=false .',
    },
    {
      uses: 'docker/build-push-action@v6',
      with: {
        push: false,
        outputs: 'type=image,push=false,push-by-digest=false',
      },
    },
  ])('allows local image exporters without publication: %j', (step) => {
    expect(
      imagePublishers('other.yml', { jobs: { validation: { steps: [step] } } })
    ).toEqual([]);
  });

  it('requires stabilization candidates to reach a supported publication branch', () => {
    const doc = readFileSync(
      join(repoRoot, 'docs', 'merge-plan.md'),
      'utf8'
    ).replace(/\s+/g, ' ');
    expect(doc).toContain(
      'Before RC tagging or staging, land the reviewed changes on a supported publication branch'
    );
    expect(doc).toContain(
      'A release-branch-only commit has no published candidate image'
    );
    expect(doc).toContain('git tag vX.Y.Z-rc.1 <published-full-sha>');
  });

  it('uses published branch-SHA images in every staging command example', () => {
    const staging = readFileSync(
      join(repoRoot, 'docs', 'k3s-sugarkube-staging.md'),
      'utf8'
    );
    const tags = Array.from(
      staging.matchAll(/default_tag=([^\s`]+)/g),
      (match) => match[1]
    );
    expect(tags.length).toBeGreaterThan(0);
    expect(
      tags.every((tag) =>
        /^(?:main|v3)-(?:[0-9a-f]{7,40}|REPLACE_(?:NEW_)?SHORTSHA)$/.test(tag)
      )
    ).toBe(true);
  });

  it('documents canonical image coordinates and keeps dev on the published mutable tag', () => {
    const config = readFileSync(join(repoRoot, 'docs', 'config.md'), 'utf8');
    expect(config).toContain('<branch>-<short-sha>');
    expect(config).not.toContain('sha-<full commit>');
    const dev = parse(
      readFileSync(
        join(repoRoot, 'deploy', 'env', 'dev', 'values.yaml'),
        'utf8'
      )
    );
    expect(dev.image.tag).toBe('main-latest');
    expect(dev.image.pullPolicy).toBe('Always');
  });
});
