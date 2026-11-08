import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, parseAllDocuments } from 'yaml';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const chart = join(root, 'charts/dspace');
const values = parse(readFileSync(`${chart}/values.yaml`, 'utf8'));
const metadata = parse(readFileSync(`${chart}/Chart.yaml`, 'utf8'));
const imageTag =
  'hotfix-47900748f61e1ef38c6289fc697f7a070f7fa3c9@sha256:5d16cde03df4cfe9a52341c26bb6167234d315f896d422af38383b760bebcfe0';
const helm = (...args: string[]) =>
  spawnSync('helm', args, { cwd: root, encoding: 'utf8' });
const render = (...args: string[]) => {
  const result = helm('template', 'dspace', chart, ...args);
  expect(result.status, result.stderr).toBe(0);
  return parseAllDocuments(result.stdout).map((document) => document.toJSON());
};
const container = (documents: ReturnType<typeof render>) =>
  documents.find((document) => document.kind === 'Deployment').spec.template
    .spec.containers[0];
const version = (documents: ReturnType<typeof render>) => {
  const entries = container(documents).env.filter(
    (entry: { name: string }) => entry.name === 'DSPACE_VERSION'
  );
  expect(entries).toHaveLength(1);
  return entries[0];
};

describe('Helm runtime version override', () => {
  it('defaults to an empty override and preserves the current image-tag version', () => {
    expect(values.runtimeVersion).toBe('');
    expect(version(render()).value).toBe(values.image.tag);
  });

  it.each(['', 'runtimeVersion='])(
    'preserves digest-qualified image-tag fallback with %s',
    (override) => {
      const args = ['--set-string', `image.tag=${imageTag}`];
      if (override) args.push('--set-string', override);
      expect(version(render(...args)).value).toBe(imageTag);
    }
  );

  it('preserves appVersion fallback when the image tag is empty', () => {
    expect(version(render('--set-string', 'image.tag=')).value).toBe(
      metadata.appVersion
    );
  });

  it.each(['token-place', 'openai'])(
    'changes only DSPACE_VERSION with provider %s',
    (provider) => {
      const args = [
        '--set-string',
        `image.tag=${imageTag}`,
        '--set-string',
        `chat.defaultProvider=${provider}`,
        '--set-string',
        'environment=staging',
      ];
      const baseline = render(...args);
      const overridden = render(
        ...args,
        '--set-string',
        'runtimeVersion=v3.0.2+4790074'
      );
      expect(version(overridden).value).toBe('v3.0.2+4790074');
      expect(container(overridden).image).toBe(
        `${values.image.repository}:${imageTag}`
      );
      version(baseline).value = 'v3.0.2+4790074';
      // Includes provider, environment, probes, resources, ports, and all other manifests.
      expect(overridden).toEqual(baseline);
    }
  );

  it('uses the override even without an image tag', () => {
    expect(
      version(
        render(
          '--set-string',
          'image.tag=',
          '--set-string',
          'runtimeVersion=v3.0.2+4790074'
        )
      ).value
    ).toBe('v3.0.2+4790074');
  });

  it.each([
    ['', 'env[1].value=duplicate-version'],
    ['', 'env[1].valueFrom.fieldRef.fieldPath=metadata.name'],
    ['v3.0.2+4790074', 'env[1].value=duplicate-version'],
    ['v3.0.2+4790074', 'env[1].valueFrom.fieldRef.fieldPath=metadata.name'],
  ])(
    'rejects a duplicate DSPACE_VERSION with runtimeVersion=%s and %s',
    (runtimeVersion, source) => {
      const result = helm(
        'template',
        'dspace',
        chart,
        '--set-string',
        `runtimeVersion=${runtimeVersion}`,
        '--set-string',
        'env[0].name=CUSTOM_SETTING',
        '--set-string',
        'env[0].value=preserved',
        '--set-string',
        'env[1].name=DSPACE_VERSION',
        '--set-string',
        source
      );
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain(
        'env must not contain DSPACE_VERSION; use runtimeVersion'
      );
    }
  );

  it('preserves unrelated generic environment entries', () => {
    const documents = render(
      '--set-string',
      'runtimeVersion=v3.0.2+4790074',
      '--set-string',
      'env[0].name=CUSTOM_SETTING',
      '--set-string',
      'env[0].value=preserved'
    );
    expect(version(documents).value).toBe('v3.0.2+4790074');
    expect(container(documents).env).toContainEqual({
      name: 'CUSTOM_SETTING',
      value: 'preserved',
    });
  });

  it.each(['true', '302'])('rejects non-string runtimeVersion %s', (value) => {
    const result = helm(
      'template',
      'dspace',
      chart,
      '--set',
      `runtimeVersion=${value}`
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('runtimeVersion');
    expect(result.stderr).toContain('string');
  });
});
