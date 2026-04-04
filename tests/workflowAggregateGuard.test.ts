import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

describe('workflow aggregate guardrails', () => {
    it('keeps the build workflow check run name stable', () => {
        const buildWorkflow = readFileSync(join(repoRoot, '.github/workflows/build.yml'), 'utf8');

        expect(buildWorkflow).toMatch(/^name:\s*build\s*$/m);
        expect(buildWorkflow).toMatch(/jobs:\s*\n\s*build:\s*\n\s*name:\s*build/m);
        expect(buildWorkflow).toMatch(/pull_request:/);
    });

    it('ensures ci-aggregate tracks critical workflows', () => {
        const aggregateWorkflow = readFileSync(join(repoRoot, '.github/workflows/ci-aggregate.yml'), 'utf8');
        const aggregateScript = readFileSync(join(repoRoot, '.github/scripts/verify-workflow-health.mjs'), 'utf8');

        expect(aggregateWorkflow).toMatch(/^name:\s*ci-aggregate\s*$/m);
        expect(aggregateWorkflow).toMatch(/pull_request:/);

        for (const workflowName of ['build', 'tests', 'CI', 'ci-sentinel']) {
            expect(aggregateScript).toContain(`'${workflowName}'`);
        }

        expect(aggregateScript).toContain('/actions/runs?per_page=100&head_sha=');
    });
});
