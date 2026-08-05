import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  assertExpectedDigest,
  readLocalCoordinates,
  releaseManifest,
  validateImageTag,
  validateReleaseSource,
} from '../scripts/check-release-consistency.mjs';

const sha = '0123456789abcdef0123456789abcdef01234567';
const digest = (value: string) => `sha256:${value.repeat(64)}`;

function coordinateTree(run: (root: string) => void) {
  const root = mkdtempSync(join(tmpdir(), 'release-coordinates-'));
  mkdirSync(join(root, 'frontend'), { recursive: true });
  mkdirSync(join(root, 'charts/dspace'), { recursive: true });
  mkdirSync(join(root, 'docs/apps'), { recursive: true });
  const json = (path: string, value: unknown) =>
    writeFileSync(join(root, path), `${JSON.stringify(value)}\n`);
  json('package.json', { version: '3.1.1' });
  json('frontend/package.json', { version: '3.1.1' });
  json('package-lock.json', {
    version: '3.1.1',
    packages: { '': { version: '3.1.1' } },
  });
  writeFileSync(
    join(root, 'charts/dspace/Chart.yaml'),
    'version: 4.2.0\nappVersion: "3.1.1"\n'
  );
  writeFileSync(join(root, 'docs/apps/dspace.version'), '4.2.0\n');
  try {
    run(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

describe('release coordinate consistency', () => {
  it('accepts independently versioned application and chart coordinates', () =>
    coordinateTree((root) =>
      expect(readLocalCoordinates(root)).toEqual({
        applicationVersion: '3.1.1',
        chartVersion: '4.2.0',
      })
    ));

  it.each([
    ['package.json', { version: 'not-semver' }, 'root package version'],
    ['frontend/package.json', { version: '3.1.2' }, 'frontend package version'],
    [
      'package-lock.json',
      { version: '3.1.2', packages: { '': { version: '3.1.1' } } },
      'lockfile version',
    ],
    [
      'package-lock.json',
      { version: '3.1.1', packages: { '': { version: '3.1.2' } } },
      'lockfile root version',
    ],
  ])('rejects metadata mismatch in %s', (path, body, message) =>
    coordinateTree((root) => {
      writeFileSync(join(root, path), JSON.stringify(body));
      expect(() => readLocalCoordinates(root)).toThrow(message);
    })
  );

  it('rejects chart appVersion drift', () =>
    coordinateTree((root) => {
      writeFileSync(
        join(root, 'charts/dspace/Chart.yaml'),
        'version: 4.2.0\nappVersion: "3.1.2"\n'
      );
      expect(() => readLocalCoordinates(root)).toThrow('chart appVersion');
    }));

  it('rejects documented chart-version drift', () =>
    coordinateTree((root) => {
      writeFileSync(join(root, 'docs/apps/dspace.version'), '4.2.1\n');
      expect(() => readLocalCoordinates(root)).toThrow('documented chart version');
    }));

  it('emits stable canonical manifest JSON data', () => {
    const input = {
      applicationVersion: '3.1.1',
      sourceRevision: sha,
      imageTag: 'main-0123456',
      imageDigest: digest('1'),
      chartVersion: '4.2.0',
      chartDigest: digest('2'),
      semanticTag: 'v3.1.1',
    };
    expect(releaseManifest(input)).toEqual({
      schemaVersion: 1,
      app: 'dspace',
      applicationVersion: '3.1.1',
      sourceRevision: sha,
      imageTag: 'main-0123456',
      imageDigest: digest('1'),
      chartVersion: '4.2.0',
      chartDigest: digest('2'),
      semanticTag: 'v3.1.1',
    });
    expect(releaseManifest(JSON.parse(JSON.stringify(input)))).toEqual(releaseManifest(input));
  });

  it.each([
    'semantic and immutable image index digests differ',
    'published chart digest does not equal the push result',
  ])('rejects digest evidence mismatches: %s', (message) => {
    expect(() => assertExpectedDigest(digest('1'), digest('2'), message)).toThrow(message);
    expect(() => assertExpectedDigest(digest('1'), digest('1'), message)).not.toThrow();
  });

  it.each(['v3.1.1', 'main-latest', 'feature-0123456', 'main-short'])(
    'rejects mutable or malformed deployment tag %s',
    (tag) => {
      expect(() => validateImageTag(tag, sha)).toThrow();
    }
  );

  it.each([
    ['imageDigest', 'sha256:nope'],
    ['chartDigest', digest('g')],
    ['semanticTag', 'v3.1.2'],
  ])('rejects malformed or mismatched manifest field %s', (field, value) => {
    const input: any = {
      applicationVersion: '3.1.1',
      sourceRevision: sha,
      imageTag: 'main-0123456',
      imageDigest: digest('1'),
      chartVersion: '4.2.0',
      chartDigest: digest('2'),
      semanticTag: 'v3.1.1',
    };
    input[field] = value;
    expect(() => releaseManifest(input)).toThrow();
  });

  it('peels annotated tags and rejects a tag/commit mismatch', () =>
    coordinateTree((root) => {
      const git = (...args: string[]) =>
        execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
      git('init', '-q');
      git('config', 'user.name', 'Test');
      git('config', 'user.email', 'test@example.invalid');
      git('add', '.');
      git('commit', '-qm', 'release');
      const approved = git('rev-parse', 'HEAD');
      git('tag', '-a', 'v3.1.1', '-m', 'application release');
      git('tag', '-a', 'chart-v4.2.0', '-m', 'chart release');
      git('update-ref', 'refs/remotes/origin/main', approved);
      expect(
        validateReleaseSource({
          root,
          releaseTag: 'v3.1.1',
          chartTag: 'chart-v4.2.0',
          sourceRevision: approved,
          branch: 'main',
        }).sourceRevision
      ).toBe(approved);
      writeFileSync(join(root, 'new'), 'new');
      git('add', 'new');
      git('commit', '-qm', 'later');
      const later = git('rev-parse', 'HEAD');
      git('tag', '-f', 'chart-v4.2.0', later);
      git('checkout', '-q', approved);
      expect(() => validateReleaseSource({
        root, releaseTag: 'v3.1.1', chartTag: 'chart-v4.2.0',
        sourceRevision: approved, branch: 'main',
      })).toThrow('chart release tag does not peel');
      git('checkout', '-q', later);
      expect(() =>
        validateReleaseSource({
          root,
          releaseTag: 'v3.1.1',
          chartTag: 'chart-v4.2.0',
          sourceRevision: git('rev-parse', 'HEAD'),
          branch: 'main',
        })
      ).toThrow('release tag');
    }));

  it.each([
    ['release tag', 'v3.1.2', 'chart-v4.2.0'],
    ['chart release tag', 'v3.1.1', 'chart-v4.2.1'],
  ])('rejects a %s/version mismatch', (message, releaseTag, chartTag) =>
    coordinateTree((root) => {
      const git = (...args: string[]) =>
        execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
      git('init', '-q');
      git('config', 'user.name', 'Test');
      git('config', 'user.email', 'test@example.invalid');
      git('add', '.');
      git('commit', '-qm', 'release');
      const approved = git('rev-parse', 'HEAD');
      git('tag', releaseTag);
      git('tag', chartTag);
      git('update-ref', 'refs/remotes/origin/main', approved);
      expect(() => validateReleaseSource({
        root, releaseTag, chartTag, sourceRevision: approved, branch: 'main',
      })).toThrow(message);
    }));
});
