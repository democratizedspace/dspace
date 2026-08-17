import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { parse } from 'yaml';

const chart = 'charts/dspace';
const helm = (...args: string[]) =>
  spawnSync('helm', args, { cwd: process.cwd(), encoding: 'utf8' });

describe('Helm Chat provider deployment coordinate', () => {
  it('declares a schema-validated token.place default', () => {
    const values = parse(readFileSync(`${chart}/values.yaml`, 'utf8'));
    const schema = JSON.parse(
      readFileSync(`${chart}/values.schema.json`, 'utf8')
    );
    expect(values.chat.defaultProvider).toBe('token-place');
    expect(schema.properties.chat.properties.defaultProvider.enum).toEqual([
      'token-place',
      'openai',
    ]);
  });

  it.each(['token-place', 'openai'])('renders %s exactly once', (provider) => {
    const result = helm(
      'template',
      'dspace',
      chart,
      '--set',
      `chat.defaultProvider=${provider}`
    );
    expect(result.status, result.stderr).toBe(0);
    expect(
      result.stdout.match(/name: DSPACE_DEFAULT_CHAT_PROVIDER/g) ?? []
    ).toHaveLength(1);
    expect(result.stdout).toContain(`value: \"${provider}\"`);
  });

  it('rejects invalid schema values', () => {
    const result = helm('lint', chart, '--set', 'chat.defaultProvider=invalid');
    expect(result.status).not.toBe(0);
    expect(result.stdout + result.stderr).toContain(
      'must be one of the following'
    );
  });

  it('rejects invalid values during template rendering', () => {
    const result = helm(
      'template',
      'dspace',
      chart,
      '--set',
      'chat.defaultProvider=invalid'
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(
      'chat.defaultProvider must be exactly one of: token-place, openai'
    );
  });

  it('rejects a duplicate generic environment entry', () => {
    const result = helm(
      'template',
      'dspace',
      chart,
      '--set',
      'env[0].name=DSPACE_DEFAULT_CHAT_PROVIDER',
      '--set',
      'env[0].value=openai'
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('use chat.defaultProvider');
  });
});
