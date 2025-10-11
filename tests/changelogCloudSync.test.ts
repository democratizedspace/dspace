import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('September 15, 2023 changelog', () => {
    it('acknowledges shipped Cloud Sync instead of promising future cloud saves', () => {
        const changelogPath = join(
            process.cwd(),
            'frontend',
            'src',
            'pages',
            'docs',
            'md',
            'changelog',
            '20230915.md'
        );

        const content = readFileSync(changelogPath, 'utf8');

        expect(content).not.toMatch(/will eventually have cloud saves/i);
        expect(content).toMatch(/Cloud Sync/);
    });
});
