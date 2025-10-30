import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('offline-first documentation', () => {
    it('calls out the no-op worker feature flag strategy', () => {
        const docPath = path.join(__dirname, '..', 'docs', 'ops', 'offline-first.md');
        const content = fs.readFileSync(docPath, 'utf8');

        expect(content).toMatch(/no-?op worker/i);
        expect(content).toMatch(/feature flag/i);
    });
});
