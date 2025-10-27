import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

describe('June 30, 2023 changelog AI companion note', () => {
    it('no longer punts NPC chat to a future update', () => {
        const currentDir = dirname(fileURLToPath(import.meta.url));
        const changelogPath = resolve(
            currentDir,
            '../frontend/src/pages/docs/md/changelog/20230630.md'
        );
        const doc = readFileSync(changelogPath, 'utf8');

        expect(doc).not.toMatch(/In upcoming versions, I'll be leveraging large language models/i);
        expect(doc).not.toMatch(/stay tuned/i);
    });
});
