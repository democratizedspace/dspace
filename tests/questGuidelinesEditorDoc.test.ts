import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

describe('quest guidelines editor language', () => {
    it('describes the in-game editor as available now', () => {
        const currentDir = dirname(fileURLToPath(import.meta.url));
        const docPath = resolve(
            currentDir,
            '../frontend/src/pages/docs/md/quest-guidelines.md'
        );
        const doc = readFileSync(docPath, 'utf8');

        expect(doc).not.toMatch(/Once the in-game editor is complete/i);
        expect(doc).toMatch(/Use the in-game editor/i);
    });
});
