import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('November 1, 2025 changelog release checklist', () => {
    it('drops the prerelease checklist language from the published notes', () => {
        const changelogPath = join(
            process.cwd(),
            'frontend',
            'src',
            'pages',
            'docs',
            'md',
            'changelog',
            '20251101.md'
        );

        const content = readFileSync(changelogPath, 'utf8');

        expect(content).not.toMatch(/This checklist will be removed before the final release/i);
        expect(content).not.toMatch(/\[x\]/i);
        expect(content).not.toMatch(/💯/);
    });
});
