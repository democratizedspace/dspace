import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

describe('workflow integrity guard', () => {
    it('passes for current workflow configuration', () => {
        const output = execFileSync('node', ['scripts/check-workflows.mjs'], {
            cwd: repoRoot,
            encoding: 'utf8',
        });

        expect(output).toContain('Workflow integrity check passed');
    });
});
