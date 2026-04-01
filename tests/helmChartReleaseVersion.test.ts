import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

const chartPath = join(repoRoot, 'charts', 'dspace', 'Chart.yaml');
const valuesPath = join(repoRoot, 'charts', 'dspace', 'values.yaml');
const packageJson = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'));

describe('charts/dspace release metadata', () => {
    const chartContent = readFileSync(chartPath, 'utf8');
    const valuesContent = readFileSync(valuesPath, 'utf8');

    const appVersionMatch = chartContent.match(/appVersion:\s*"?([^"\n]+)"?/);
    const imageTagMatch = valuesContent.match(/^\s*tag:\s*([^\n]+)/m);

    it('keeps appVersion aligned with the default image tag and package release', () => {
        expect(appVersionMatch?.[1], 'appVersion should be defined in Chart.yaml').toBe(
            `v${packageJson.version}`,
        );
        expect(imageTagMatch?.[1].trim(), 'image.tag should be defined in values.yaml').toBe(
            `v${packageJson.version}`,
        );
    });
});
