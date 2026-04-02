import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

describe('workflow regression guards', () => {
    it('keeps build workflow enabled for pull requests', () => {
        const buildWorkflowPath = join(repoRoot, '.github', 'workflows', 'build.yml');
        const buildWorkflow = readFileSync(buildWorkflowPath, 'utf8');

        expect(buildWorkflow).toMatch(/^name:\s*Build & Publish Container/m);
        expect(buildWorkflow).toMatch(/^\s{2}pull_request:\s*$/m);
    });

    it('keeps ci-sentinel checks for core PR workflows', () => {
        const sentinelWorkflowPath = join(repoRoot, '.github', 'workflows', 'ci-sentinel.yml');
        const sentinelWorkflow = readFileSync(sentinelWorkflowPath, 'utf8');

        expect(sentinelWorkflow).toContain('test -f .github/workflows/build.yml');
        expect(sentinelWorkflow).toContain("grep -q '^  pull_request:' .github/workflows/build.yml");
        expect(sentinelWorkflow).toContain("grep -q '^  pull_request:' .github/workflows/tests.yml");
        expect(sentinelWorkflow).toContain("grep -q '^  pull_request:' .github/workflows/link-check.yml");
        expect(sentinelWorkflow).toContain("ruby -e \"require 'yaml';");
    });
});
