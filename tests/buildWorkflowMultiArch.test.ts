import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

type Step = { uses?: string; run?: string; with?: Record<string, unknown> };
type Workflow = { jobs: Record<string, { steps?: Step[] }> };

function publishesExporter(value: string): boolean {
  return value
    .split(/\r?\n/)
    .some(
      (exporter) =>
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
        publishesExporter(String(step.with?.[input] ?? ''))
      );
      const shell = (step.run ?? '')
        .split('\n')
        .filter((line) => !line.trim().startsWith('#'))
        .join('\n');
      const shellPublish =
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
              return (
                (match[1] !== '--set' ||
                  /^.+\.(?:output|cache-to)\+?=/.test(value)) &&
                publishesExporter(value)
              );
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
    { run: 'docker image push ghcr.io/example/image:tag' },
    { run: 'docker manifest push ghcr.io/example/image:tag' },
    {
      run: 'docker buildx imagetools create --tag ghcr.io/example/image:tag source@sha256:abc',
    },
    { run: 'docker buildx build --platform linux/amd64 --push .' },
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
  });
});
