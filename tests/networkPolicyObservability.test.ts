import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = join(__dirname, '..');
const valuesPath = join(repoRoot, 'deploy', 'charts', 'dspace', 'values.yaml');
const templatePath = join(
  repoRoot,
  'deploy',
  'charts',
  'dspace',
  'templates',
  'networkpolicy.yaml',
);

const valuesYaml = readFileSync(valuesPath, 'utf8');
const networkPolicyTemplate = readFileSync(templatePath, 'utf8');

describe('network policy observability defaults', () => {
  it('grants prometheus access by default when metrics are enabled', () => {
    expect(valuesYaml).toMatch(
      /metricsScraper:\s*\n\s*enabled: true\n\s*namespace: monitoring\n\s*podSelector:\n\s*app\.kubernetes\.io\/name: prometheus/,
    );
  });

  it('templates an ingress rule for the metrics scraper namespace', () => {
    expect(networkPolicyTemplate).toMatch(/\$metricsScraper\.namespace/);
  });
});
