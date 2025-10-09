import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const changelogPath = join(
    process.cwd(),
    'frontend',
    'src',
    'pages',
    'docs',
    'md',
    'changelog',
    '20230101.md'
);

describe('January 1, 2023 changelog', () => {
    it('documents that processes reserve consumed materials immediately', () => {
        const doc = readFileSync(changelogPath, 'utf8');
        expect(doc).toMatch(/processes now consume required materials as soon as they start/i);
    });
});
