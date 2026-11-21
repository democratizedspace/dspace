import { describe, expect, it } from 'vitest';
import {
  chmodSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
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

function runShell(run: string, env: Record<string, string> = {}) {
  const directory = mkdtempSync(join(tmpdir(), 'ci-image-workflow-'));
  const bin = join(directory, 'bin');
  mkdirSync(bin);
  const output = join(directory, 'output');
  const log = join(directory, 'calls.log');
  writeFileSync(output, '');
  writeFileSync(log, '');
  const executable = (name: string, body: string) => {
    const path = join(bin, name);
    writeFileSync(path, `#!/usr/bin/env bash\n${body}`);
    chmodSync(path, 0o755);
  };
  executable(
    'gh',
    'echo gh >> "$MOCK_LOG"\nprintf \'%s\\n\' "$MOCK_RELEASE_JSON"\n'
  );
  executable(
    'git',
    `echo "$*" >> "$MOCK_LOG"
if [[ "$1 $2" == "rev-parse HEAD" ]]; then echo "$MOCK_SOURCE_SHA"; exit 0; fi
if [[ "$1" == "rev-parse" && "$2" == *'^'{commit} ]]; then echo "$MOCK_SOURCE_SHA"; exit 0; fi
if [[ "$1" == "ls-remote" ]]; then
  [[ "${'$'}*" == *refs/heads/main* ]] && exit "${'$'}MOCK_MAIN_LS"
  exit "${'$'}MOCK_V3_LS"
fi
if [[ "$1" == "fetch" ]]; then exit 0; fi
if [[ "$1 $2" == "merge-base --is-ancestor" ]]; then
  [[ "${'$'}*" == *origin/main* ]] && exit "${'$'}MOCK_MAIN_MERGE"
  exit "${'$'}MOCK_V3_MERGE"
fi
if [[ "$1" == "rev-parse" ]]; then echo 1111111111111111111111111111111111111111; exit 0; fi
exit 99
`
  );
  mkdirSync(join(directory, 'charts', 'dspace'), { recursive: true });
  writeFileSync(
    join(directory, 'charts', 'dspace', 'Chart.yaml'),
    'version: 3.0.0\n'
  );
  const result = spawnSync('bash', ['-c', run], {
    cwd: directory,
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${bin}:${process.env.PATH}`,
      GITHUB_OUTPUT: output,
      GITHUB_REPOSITORY: 'democratizedspace/dspace',
      MOCK_LOG: log,
      MOCK_RELEASE_JSON: '{}',
      MOCK_SOURCE_SHA: '0123456789abcdef0123456789abcdef01234567',
      MOCK_MAIN_LS: '2',
      MOCK_V3_LS: '2',
      MOCK_MAIN_MERGE: '1',
      MOCK_V3_MERGE: '1',
      ...env,
    },
  });
  return {
    ...result,
    calls: readFileSync(log, 'utf8'),
    output: readFileSync(output, 'utf8'),
  };
}

// Interpret only the expected predicate language, not arbitrary workflow expressions.
function enables(predicate: string, context: Record<string, string>) {
  const expression = predicate.replace(/^\$\{\{\s*|\s*\}\}$/g, '');
  const parts = expression.match(
    /(?:github|needs)[.a-z_-]+|cancelled\(\)|'[^']*'|==|!=|&&|\|\||[()!]/gi
  )!;
  expect(parts.join('').replace(/ /g, '')).toBe(expression.replace(/\s/g, ''));
  const condition = parts
    .map((part) => {
      if (part === 'cancelled()') return String(context.cancelled === 'true');
      if (part.startsWith("'")) return part.toLowerCase();
      if (!/^(github|needs)\./.test(part)) return part;
      expect(context).toHaveProperty([part]);
      return JSON.stringify(context[part].toLowerCase());
    })
    .join(' ');
  return Function('"use strict"; return (' + condition + ');')();
}

const canonicalContext = {
  'github.repository': 'democratizedspace/dspace',
  'github.ref': 'refs/heads/main',
  'github.event_name': 'workflow_dispatch',
  'github.event.action': '',
  'github.event.inputs.release_tag': '',
  'github.event.inputs.branch': 'main',
  'needs.manual-publisher-trust.result': 'success',
  'needs.publisher-source.result': 'success',
  'needs.publisher-native.result': 'success',
  'needs.publisher-index.result': 'success',
};

describe('ci-image.yml triggers', () => {
  it('keeps ordinary branch coverage on main and v3, with no tag-push trigger', () => {
    expect(workflow.on.push.branches).toEqual(['v3', 'main']);
    expect(workflow.on.pull_request.branches).toEqual(['v3', 'main']);
    expect(workflow.on.push.tags).toBeUndefined();
  });

  it('has exactly one canonical semantic-publication event: a published release', () => {
    expect(workflow.on.release).toEqual({ types: ['published'] });
    // No push.tags trigger alongside release: published — that combination would race
    // and turn every ordinary release into an expected duplicate-publication failure.
    expect(workflow.on.push.tags).toBeUndefined();
  });

  it('keeps an empty manual recovery tag on the ordinary branch-image path', () => {
    expect(workflow.on.workflow_dispatch.inputs.release_tag).toMatchObject({
      type: 'string',
      required: false,
      default: '',
    });
    const publisherCondition = workflow.jobs.image.if;
    expect(publisherCondition).toContain(
      "github.repository == 'democratizedspace/dspace'"
    );
    expect(publisherCondition).toContain("github.ref == 'refs/heads/main'");
    expect(publisherCondition).toContain("github.ref == 'refs/heads/v3'");
    expect(publisherCondition).not.toContain('pull_request');
    expect(publisherCondition).toContain(
      "github.event.inputs.release_tag == ''"
    );
    expect(workflow.jobs['local-build'].if).toBe(
      "github.event_name != 'release' && !(github.event_name == 'workflow_dispatch' && github.event.inputs.release_tag != '')"
    );
    expect(enables(workflow.jobs.image.if, canonicalContext)).toBe(true);
    expect(
      enables(workflow.jobs['semantic-release'].if, canonicalContext)
    ).toBe(false);
  });

  it('requires the exact-ref gate for manual semantic recovery but not normal published releases', () => {
    const predicate = workflow.jobs['semantic-release'].if;
    const recovery = {
      ...canonicalContext,
      'github.event.inputs.release_tag': 'v3.1.0',
    };
    expect(enables(predicate, recovery)).toBe(true);
    for (const outcome of ['failure', 'skipped', 'cancelled']) {
      expect(
        enables(predicate, {
          ...recovery,
          'needs.manual-publisher-trust.result': outcome,
        })
      ).toBe(false);
    }
    expect(enables(predicate, { ...recovery, cancelled: 'true' })).toBe(false);
    expect(
      enables(predicate, { ...recovery, 'github.event_name': 'pull_request' })
    ).toBe(false);
    expect(
      enables(predicate, {
        ...canonicalContext,
        'github.event_name': 'release',
        'github.event.action': 'published',
        'github.ref': 'refs/tags/v3.1.0',
        'needs.manual-publisher-trust.result': 'skipped',
      })
    ).toBe(true);
    expect(
      enables(predicate, {
        ...canonicalContext,
        'github.event_name': 'release',
        'github.event.action': 'created',
      })
    ).toBe(false);
    expect(enables(workflow.jobs.image.if, recovery)).toBe(false);
    expect(workflow.jobs['semantic-release'].needs).toBe(
      'manual-publisher-trust'
    );
  });

  it('checks exact manual refs and repository before any checkout, token or registry action', () => {
    const trust = workflow.jobs['manual-publisher-trust'];
    expect(trust.permissions).toEqual({});
    expect(trust.if).toBe("github.event_name == 'workflow_dispatch'");
    const [step] = findSteps(trust);
    expect(trust.steps).toHaveLength(1);
    expect(step.uses).toBeUndefined();
    expect(JSON.stringify(step)).not.toMatch(/secrets|token|ghcr/i);
    const status = (
      ref: string,
      branch: string,
      tag = '',
      repo = 'democratizedspace/dspace'
    ) =>
      spawnSync('bash', ['-c', step.run], {
        env: {
          ...process.env,
          GITHUB_REPOSITORY: repo,
          GITHUB_REF: ref,
          TARGET_BRANCH: branch,
          RELEASE_TAG: tag,
        },
      }).status;
    for (const tag of ['', 'v3.1.0']) {
      expect(status('refs/heads/main', 'main', tag)).toBe(0);
      expect(status('refs/heads/v3', 'main', tag)).toBe(0);
      for (const ref of [
        'refs/heads/Main',
        'refs/heads/V3',
        'refs/heads/feature',
        'refs/tags/main',
      ]) {
        expect(status(ref, 'main', tag)).not.toBe(0);
      }
      expect(status('refs/heads/main', 'main', tag, 'other/dspace')).not.toBe(
        0
      );
      expect(
        status('refs/heads/main', 'main', tag, 'Democratizedspace/dspace')
      ).not.toBe(0);
    }
    for (const branch of ['main', 'v3', ''])
      expect(status('refs/heads/main', branch)).toBe(0);
    for (const branch of [
      'feature',
      'Main',
      'refs/tags/main',
      'refs/heads/main',
    ]) {
      expect(status('refs/heads/main', branch)).not.toBe(0);
    }
  });

  it('resolves ordinary dispatch targets as branch refs only, not tag names or arbitrary input', () => {
    const source = workflow.jobs['publisher-source'];
    const [checkout] = findStepsUsing(source, 'actions/checkout');
    expect(checkout.with.ref).toContain(
      "format('refs/heads/{0}', github.event.inputs.branch || github.ref_name)"
    );
    expect(checkout.with.ref).toContain('|| github.sha');
    expect(source.needs).toBe('manual-publisher-trust');
    expect(enables(source.if, canonicalContext)).toBe(true);
    expect(
      enables(source.if, {
        ...canonicalContext,
        'needs.manual-publisher-trust.result': 'failure',
      })
    ).toBe(false);
    for (const event of ['push', 'pull_request']) {
      expect(
        enables(source.if, {
          ...canonicalContext,
          'github.event_name': event,
          'needs.manual-publisher-trust.result': 'skipped',
        })
      ).toBe(true);
    }
  });
});

describe('ci-image.yml "image" job (ordinary branch publish path)', () => {
  const job = workflow.jobs.image;

  it('never runs for release events', () => {
    expect(job.if).toContain("github.event_name == 'push'");
    expect(job.if).toContain("github.event_name == 'workflow_dispatch'");
    expect(job.if).not.toContain("github.event_name == 'release'");
  });

  it('blocks PR, tag, foreign-repository, and feature-ref dispatch publication', () => {
    const ordinary = (
      event: string,
      ref: string,
      tag = '',
      repository = 'democratizedspace/dspace'
    ) =>
      enables(job.if, {
        ...canonicalContext,
        'github.repository': repository,
        'github.ref': ref,
        'github.event_name': event,
        'github.event.inputs.release_tag': tag,
      });
    expect(ordinary('pull_request', 'refs/heads/main')).toBe(false);
    expect(ordinary('pull_request', 'refs/pull/7/merge')).toBe(false);
    expect(ordinary('push', 'refs/tags/v3.1.0')).toBe(false);
    expect(ordinary('workflow_dispatch', 'refs/heads/topic')).toBe(false);
    expect(ordinary('workflow_dispatch', 'refs/heads/main', 'v3.1.0')).toBe(
      false
    );
    expect(ordinary('push', 'refs/heads/main', '', 'my-fork/dspace')).toBe(
      false
    );
    expect(ordinary('push', 'refs/heads/main')).toBe(true);
    expect(ordinary('workflow_dispatch', 'refs/heads/v3')).toBe(true);

    const source = findSteps(workflow.jobs['publisher-source']).find(
      (step) => step.id === 'source'
    );
    expect(source.run).toContain(
      '[[ "$SOURCE_BRANCH" == main || "$SOURCE_BRANCH" == v3 ]]'
    );
  });

  it('continues after a skipped manual ancestor only when immediate dependencies succeed', () => {
    const source = workflow.jobs['publisher-source'];
    const native = workflow.jobs['publisher-native'];
    const index = workflow.jobs['publisher-index'];
    for (const event of ['pull_request', 'push']) {
      const context = {
        ...canonicalContext,
        'github.event_name': event,
        'github.ref':
          event === 'push' ? 'refs/heads/main' : 'refs/pull/4904/merge',
        'needs.manual-publisher-trust.result': 'skipped',
      };
      expect(enables(source.if, context)).toBe(true);
      expect(enables(native.if, context)).toBe(true);
      expect(enables(index.if, context)).toBe(true);
      expect(enables(job.if, context)).toBe(event === 'push');
      // Even an ordinary PR evaluated with an allowed base ref cannot publish.
      expect(
        enables(job.if, {
          ...context,
          'github.event_name': 'pull_request',
          'github.ref': 'refs/heads/main',
        })
      ).toBe(false);
      for (const target of [native, index, job]) {
        expect(target.if).toContain('!cancelled()'); // Suppress implicit transitive success().
        expect(enables(target.if, { ...context, cancelled: 'true' })).toBe(
          false
        );
      }
      for (const outcome of ['failure', 'skipped', 'cancelled']) {
        const badSource = {
          ...context,
          'needs.publisher-source.result': outcome,
        };
        expect(enables(native.if, badSource)).toBe(false);
        expect(enables(index.if, badSource)).toBe(false);
        expect(enables(job.if, badSource)).toBe(false);
        expect(
          enables(index.if, {
            ...context,
            'needs.publisher-native.result': outcome,
          })
        ).toBe(false);
        expect(
          enables(job.if, {
            ...context,
            'needs.publisher-index.result': outcome,
          })
        ).toBe(false);
      }
    }
  });

  it.each([
    '2026-11-20T01:41:58-08:00',
    '2026-11-20T15:11:58+05:30',
    '2026-11-20T09:41:58+00:00',
  ])(
    'freezes source time %s as the exact UTC instant accepted by production',
    (offsetStamp) => {
      const directory = mkdtempSync(join(tmpdir(), 'ci-image-timezone-'));
      try {
        const output = join(directory, 'output');
        const meta = join(directory, 'build_meta.json');
        const git = (...args: string[]) => {
          const result = spawnSync('git', args, {
            cwd: directory,
            encoding: 'utf8',
            env: {
              ...process.env,
              GIT_AUTHOR_DATE: offsetStamp,
              GIT_COMMITTER_DATE: offsetStamp,
            },
          });
          expect(result.status, result.stderr).toBe(0);
          return result.stdout.trim();
        };
        git('init', '--quiet');
        git(
          '-c',
          'user.name=Fixture',
          '-c',
          'user.email=fixture@example.invalid',
          'commit',
          '--allow-empty',
          '--no-gpg-sign',
          '--quiet',
          '-m',
          'Timestamp fixture'
        );
        const sha = git('rev-parse', 'HEAD');
        expect(git('show', '-s', '--format=%cI', 'HEAD').slice(0, 19)).toBe(
          offsetStamp.slice(0, 19)
        );
        const source = findSteps(workflow.jobs['publisher-source']).find(
          (step) => step.id === 'source'
        );
        writeFileSync(join(directory, 'package.json'), '{"version":"3.1.0"}');
        const result = spawnSync('bash', ['-c', source.run], {
          cwd: directory,
          encoding: 'utf8',
          env: {
            ...process.env,
            SOURCE_BRANCH: 'main',
            GITHUB_EVENT_NAME: 'push',
            GITHUB_SHA: sha,
            GITHUB_OUTPUT: output,
            TZ: 'Pacific/Honolulu',
          },
        });
        expect(result.status, result.stderr).toBe(0);
        const stamp = readFileSync(output, 'utf8').match(/^stamp=(.+)$/m)?.[1];
        expect(stamp).toBe('2026-11-20T09:41:58Z');
        expect(Date.parse(stamp!)).toBe(Date.parse(offsetStamp));
        const validator = spawnSync(
          process.execPath,
          [join(repoRoot, 'scripts', 'write-build-meta.mjs')],
          {
            cwd: directory,
            encoding: 'utf8',
            env: {
              ...process.env,
              GITHUB_SHA: sha,
              BUILD_TIMESTAMP: stamp!,
              DSPACE_PRODUCTION_BUILD: '1',
              VERIFY_BUILD_META_PATH: meta,
              DSPACE_IMAGE:
                'ghcr.io/democratizedspace/dspace:main-' + sha.slice(0, 7),
            },
          }
        );
        expect(validator.status, validator.stderr).toBe(0);
        expect(JSON.parse(readFileSync(meta, 'utf8')).buildTimestamp).toBe(
          stamp
        );
      } finally {
        rmSync(directory, { force: true, recursive: true });
      }
    }
  );

  it('serializes ordinary publication by target branch without workflow SHA', () => {
    expect(job.concurrency.group).toBe(
      'dspace-image-${{ github.event.inputs.branch || github.ref_name }}'
    );
    expect(job.concurrency.group).not.toContain('github.sha');
    expect(job.concurrency['cancel-in-progress']).toBe(false);
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

  it('validates both architectures natively, with no write token or registry export', () => {
    const native = workflow.jobs['publisher-native'];
    const source = workflow.jobs['publisher-source'];
    const index = workflow.jobs['publisher-index'];
    expect(native.strategy.matrix.include).toEqual([
      { arch: 'amd64', runner: 'ubuntu-24.04' },
      { arch: 'arm64', runner: 'ubuntu-24.04-arm' },
    ]);
    expect(native.needs).toBe('publisher-source');
    expect(source.if).toContain("github.event_name == 'pull_request'");
    expect(source.if).toContain("github.event.inputs.release_tag == ''");
    for (const candidate of [source, native, index]) {
      expect(candidate.permissions).toEqual({ contents: 'read' });
      expect(JSON.stringify(candidate)).not.toMatch(
        /--push|login-action|secrets\./
      );
      for (const step of findStepsUsing(candidate, 'actions/checkout')) {
        expect(step.with['persist-credentials']).toBe(false);
      }
    }
    const build = findSteps(native).find((step) =>
      step.name?.startsWith('Export OCI')
    );
    expect(build.run).toContain('type=oci');
    expect(build.run).toContain('type=docker');
    expect(build.run).toContain('tested-config');
    expect(build.run.match(/docker buildx build/g)).toHaveLength(1);
    const smoke = findSteps(native).find((step) =>
      step.name?.startsWith('Verify bundled')
    );
    for (const expected of [
      'verify-build-sha.mjs',
      'verify-chat-build-stamp.mjs',
      '$PWD:/verification-repo:ro',
      '/build-info.json',
      'dspace-build-revision',
    ]) {
      expect(smoke.run).toContain(expected);
    }
  });

  it('uses only same-run immutable artifacts and re-verifies the identical index in the publisher', () => {
    const index = workflow.jobs['publisher-index'];
    expect(index.needs).toEqual(['publisher-source', 'publisher-native']);
    expect(job.needs).toEqual(['publisher-source', 'publisher-index']);
    for (const current of [index, job]) {
      const [download] = findStepsUsing(current, 'actions/download-artifact');
      expect(download.uses).toMatch(
        /^actions\/download-artifact@[a-f0-9]{40}$/
      );
      expect(download.with.pattern).toBe('publisher-native-*');
      expect(download.with['run-id']).toBeUndefined();
      expect(download.with['github-token']).toBeUndefined();
    }
    const tags = findSteps(job).find((step) => step.id === 'tags');
    expect(tags.run).toContain('git rev-parse HEAD');
    expect(tags.run).toContain('prepare-native-image-index.py');
    expect(tags.run).toContain('test "$digest" = "$EXPECTED_INDEX"');
  });

  it('does not move latest after a failed write/verification or an advanced branch', () => {
    const steps = findSteps(job);
    const publication = steps.find((step) => step.run?.includes('crane push'));
    const aliasing = steps.find((step) => step.run?.includes('crane tag'));
    expect(publication.run).toMatch(
      /set -euo pipefail[\s\S]+check-absent[^\n]+\ncrane push/
    );
    expect(aliasing.if).toBeUndefined(); // default success() requires preceding publication
    expect(aliasing.run).toMatch(
      /if \[\[ .*ref%%.* != "\$SHA" \]\]; then[\s\S]+exit 0[\s\S]+fi\ncrane tag/
    );
    expect(
      steps.filter((step) => /crane (?:push|tag|copy)/.test(step.run ?? ''))
        .length
    ).toBe(2);
  });

  it('checks absence then pushes exactly once, verifies the remote children before aliasing', () => {
    const steps = findSteps(job);
    const pushIndex = stepIndex(job, (step) =>
      step.run?.includes('crane push')
    );
    const push = steps[pushIndex];
    expect(push.run.indexOf('check-absent')).toBeLessThan(
      push.run.indexOf('crane push')
    );
    expect(push.run).toContain('crane push --index');
    expect(push['continue-on-error']).toBeUndefined();
    expect(JSON.stringify(job).match(/crane push/g)).toHaveLength(1);
    const verify = steps[pushIndex + 1].run;
    const tag = verify.indexOf('crane tag');
    expect(tag).toBeGreaterThan(0);
    expect(verify.indexOf('await inspectImage(')).toBeLessThan(tag);
    expect(
      verify.indexOf(
        'assert.deepEqual(remote, { indexDigest: EXPECTED_INDEX, amd64Digest: digests.amd64, arm64Digest: digests.arm64 })'
      )
    ).toBeLessThan(tag);
    expect(verify.indexOf('git ls-remote')).toBeLessThan(tag);
    expect(verify.indexOf('crane digest "$LATEST_TAG"')).toBeGreaterThan(tag);
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
    expect(job.if).toContain("github.event_name != 'release'");
    expect(job.if).toContain(
      "github.event_name == 'workflow_dispatch' && github.event.inputs.release_tag != ''"
    );
  });
});

describe('ci-image.yml "semantic-release" job (normal and recovery alias path)', () => {
  const job = workflow.jobs['semantic-release'];
  const steps = findSteps(job);
  const named = (name: string) => steps.find((step) => step.name === name);

  it('serializes semantic publication by release tag for both supported events', () => {
    expect(job.concurrency.group).toContain('github.event.release.tag_name');
    expect(job.concurrency.group).toContain('github.event.inputs.release_tag');
    expect(job.concurrency['cancel-in-progress']).toBe(false);
  });

  it('requires a stable tag belonging to an existing published, non-draft GitHub release', () => {
    const release = named('Resolve and authorize published release');
    const valid = JSON.stringify({
      tag_name: 'v3.1.1',
      draft: false,
      published_at: '2026-08-05T00:00:00Z',
    });
    const passed = runShell(release.run, {
      RELEASE_TAG: 'v3.1.1',
      MOCK_RELEASE_JSON: valid,
    });
    expect(passed.status).toBe(0);
    expect(passed.output).toBe('tag=v3.1.1\n');
    expect(passed.calls).toBe('gh\n');

    for (const tag of ['', '3.1.1', 'v3.1.1-rc.1']) {
      const failed = runShell(release.run, {
        RELEASE_TAG: tag,
        MOCK_RELEASE_JSON: valid,
      });
      expect(failed.status).not.toBe(0);
      expect(failed.calls).toBe('');
    }
    for (const releaseJson of [
      { tag_name: 'v3.1.1', draft: true, published_at: '2026-08-05T00:00:00Z' },
      { tag_name: 'v3.1.1', draft: false, published_at: null },
    ]) {
      const failed = runShell(release.run, {
        RELEASE_TAG: 'v3.1.1',
        MOCK_RELEASE_JSON: JSON.stringify(releaseJson),
      });
      expect(failed.status).not.toBe(0);
      expect(failed.calls).toBe('gh\n');
      expect(failed.output).toBe('');
    }
  });

  it('authorizes the checked-out source before lifecycle execution', () => {
    const checkout = findStepsUsing(job, 'actions/checkout')[0];
    expect(checkout.with.ref).toBe('${{ steps.release.outputs.tag }}');
    expect(checkout.with['persist-credentials']).toBe(false);
    const authorization = named('Authorize release source');
    expect(authorization.env.RELEASE_TAG).toBe(
      '${{ steps.release.outputs.tag }}'
    );
    expect(authorization.run).toContain(
      'git rev-parse "${RELEASE_TAG}^{commit}"'
    );
    expect(authorization.run).toContain('refs/remotes/origin/$branch');
    expect(authorization.run).toContain('git ls-remote --exit-code --heads');
    expect(authorization.run).toContain('elif [[ $status -ne 2 ]]');
    expect(authorization.run).toContain('${#containing_branches[@]} == 1');
    expect(authorization.run).not.toContain('|| true');
    expect(authorization.run).not.toContain(
      '${{ github.event.release.tag_name }}'
    );
    expect(steps.indexOf(authorization)).toBeLessThan(
      steps.indexOf(named('Validate all local release coordinates'))
    );
    expect(JSON.stringify(job)).not.toContain('pnpm install');
  });

  it.each([
    ['main', { MOCK_MAIN_LS: '0', MOCK_V3_LS: '2', MOCK_MAIN_MERGE: '0' }],
    ['v3', { MOCK_MAIN_LS: '2', MOCK_V3_LS: '0', MOCK_V3_MERGE: '0' }],
  ])('authorizes the sole existing containing branch: %s', (branch, env) => {
    const result = runShell(named('Authorize release source').run, {
      RELEASE_TAG: 'v3.1.1',
      ...env,
    });
    expect(result.status).toBe(0);
    expect(result.output).toContain(`source_branch=${branch}\n`);
    expect(result.calls.match(/^fetch .*$/gm)).toEqual([
      `fetch https://github.com/democratizedspace/dspace.git ${branch}:refs/remotes/origin/${branch} --quiet`,
    ]);
  });

  it.each([
    ['neither branch exists', {}],
    ['branch discovery is indeterminate', { MOCK_MAIN_LS: '3' }],
    [
      'containment is indeterminate even when the other branch contains the source',
      {
        MOCK_MAIN_LS: '0',
        MOCK_V3_LS: '0',
        MOCK_MAIN_MERGE: '3',
        MOCK_V3_MERGE: '0',
      },
    ],
    [
      'both branches contain the source',
      {
        MOCK_MAIN_LS: '0',
        MOCK_V3_LS: '0',
        MOCK_MAIN_MERGE: '0',
        MOCK_V3_MERGE: '0',
      },
    ],
  ])('fails closed when %s', (_case, env) => {
    const result = runShell(named('Authorize release source').run, {
      RELEASE_TAG: 'v3.1.1',
      ...env,
    });
    expect(result.status).not.toBe(0);
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
