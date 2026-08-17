import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import Ajv from 'ajv';
import { parse } from 'yaml';

const values = parse(readFileSync('charts/dspace/values.yaml', 'utf8'));
const schema = JSON.parse(
  readFileSync('charts/dspace/values.schema.json', 'utf8')
);
const deploymentTemplate = readFileSync(
  'charts/dspace/templates/deployment.yaml',
  'utf8'
);

describe('Helm Chat deployment default', () => {
  it('schema-validates the default and accepted provider coordinates', () => {
    const validate = new Ajv({ strict: false, validateSchema: false }).compile(
      schema
    );
    expect(values.chat.defaultProvider).toBe('token-place');
    expect(validate(values)).toBe(true);
    for (const defaultProvider of ['token-place', 'openai']) {
      expect(validate({ ...values, chat: { defaultProvider } })).toBe(true);
    }
    expect(validate({ ...values, chat: { defaultProvider: 'OPENAI' } })).toBe(
      false
    );
  });

  it('renders the deployment coordinate from its dedicated value', () => {
    expect(deploymentTemplate).toContain(
      'value: {{ .Values.chat.defaultProvider | quote }}'
    );
  });

  it('rejects duplicate configuration through generic env', () => {
    expect(deploymentTemplate).toContain('range .Values.env');
    expect(deploymentTemplate).toContain(
      'configure chat.defaultProvider instead'
    );
  });
});
