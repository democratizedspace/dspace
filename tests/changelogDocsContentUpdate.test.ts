import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('October 31, 2022 changelog', () => {
    it('no longer teases a future docs content update', () => {
        const changelogPath = join(
            process.cwd(),
            'frontend',
            'src',
            'pages',
            'docs',
            'md',
            'changelog',
            '20221031.md'
        );

        const content = readFileSync(changelogPath, 'utf8');

        expect(content).not.toMatch(/Plenty more documentation coming in the future/i);
        expect(content).not.toMatch(/Next up: a big content update/i);
    });
});
