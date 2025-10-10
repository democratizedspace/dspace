import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('dCarbon offset documentation', () => {
    it('does not describe dCarbon offsets as a future feature', () => {
        const changelogPath = join(
            process.cwd(),
            'frontend',
            'src',
            'pages',
            'docs',
            'md',
            'changelog',
            '20221210.md'
        );

        const raw = readFileSync(changelogPath, 'utf8');

        expect(raw).not.toMatch(
            /In a future update, you'll be able to burn dCarbon by paying with \[dUSD]/i
        );
    });
});
