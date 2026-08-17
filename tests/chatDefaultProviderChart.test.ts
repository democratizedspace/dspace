import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const chart = 'charts/dspace';
const hasHelm = spawnSync('helm', ['version', '--short'], { encoding: 'utf8' }).status === 0;

const render = (...args: string[]) =>
  execFileSync('helm', ['template', 'dspace', chart, ...args], {
    encoding: 'utf8',
  });

describe('Chat default provider chart coordinate', () => {
  it('declares a strict provider enum default', () => {
    const schema = JSON.parse(
      readFileSync(`${chart}/values.schema.json`, 'utf8')
    );
    expect(schema.properties.chat.properties.defaultProvider).toMatchObject({
      type: 'string',
      enum: ['token-place', 'openai'],
      default: 'token-place',
    });
  });

  it.runIf(hasHelm).each(['token-place', 'openai'])('renders %s exactly once', (provider) => {
    const deployment = render('--set', `chat.defaultProvider=${provider}`);
    expect(
      deployment.match(/name: DSPACE_DEFAULT_CHAT_PROVIDER/g)
    ).toHaveLength(1);
    expect(deployment).toContain(`value: "${provider}"`);
  });

  it.runIf(hasHelm)('rejects invalid schema values', () => {
    const result = spawnSync(
      'helm',
      ['template', 'dspace', chart, '--set', 'chat.defaultProvider=invalid'],
      { encoding: 'utf8' }
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('/chat/defaultProvider');
  });

  it.runIf(hasHelm)('rejects duplicate generic environment configuration', () => {
    const result = spawnSync(
      'helm',
      [
        'template',
        'dspace',
        chart,
        '--set',
        'env[0].name=DSPACE_DEFAULT_CHAT_PROVIDER',
        '--set',
        'env[0].value=openai',
      ],
      { encoding: 'utf8' }
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('managed by chat.defaultProvider');
  });
});
