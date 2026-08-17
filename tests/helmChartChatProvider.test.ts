import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';
import YAML from 'yaml';

const render = (args: string[] = []) =>
  execFileSync('helm', ['template', 'dspace', 'charts/dspace', ...args], {
    encoding: 'utf8',
  });

const deploymentEnv = (manifest: string) => {
  const deployment = manifest
    .split(/^---$/m)
    .map((document) => YAML.parse(document))
    .find((document) => document?.kind === 'Deployment');
  return deployment.spec.template.spec.containers[0].env;
};

describe('Helm Chat provider deployment coordinate', () => {
  it('declares a strict schema enum', () => {
    const schema = JSON.parse(
      readFileSync('charts/dspace/values.schema.json', 'utf8')
    );
    expect(schema.properties.chat.properties.defaultProvider.enum).toEqual([
      'token-place',
      'openai',
    ]);
  });

  it('renders the token.place default exactly once', () => {
    const env = deploymentEnv(render());
    expect(
      env.filter(({ name }) => name === 'DSPACE_DEFAULT_CHAT_PROVIDER')
    ).toEqual([{ name: 'DSPACE_DEFAULT_CHAT_PROVIDER', value: 'token-place' }]);
  });

  it('renders an explicit OpenAI default exactly once', () => {
    const env = deploymentEnv(render(['--set', 'chat.defaultProvider=openai']));
    expect(
      env.filter(({ name }) => name === 'DSPACE_DEFAULT_CHAT_PROVIDER')
    ).toEqual([{ name: 'DSPACE_DEFAULT_CHAT_PROVIDER', value: 'openai' }]);
  });

  it('rejects invalid values through schema validation', () => {
    expect(() => render(['--set', 'chat.defaultProvider=other'])).toThrow(
      /must be one of/
    );
  });

  it('rejects duplicate configuration through generic env', () => {
    expect(() =>
      render([
        '--set',
        'chat.defaultProvider=openai',
        '--set',
        'env[0].name=DSPACE_DEFAULT_CHAT_PROVIDER',
        '--set',
        'env[0].value=token-place',
      ])
    ).toThrow(/use chat\.defaultProvider/);
  });
});
