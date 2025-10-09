import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

describe('Solar power documentation', () => {
    it('does not defer wind power support to a future update', () => {
        const docPath = path.resolve(__dirname, '../frontend/src/pages/docs/md/solar.md');
        const content = readFileSync(docPath, 'utf8');

        expect(content).not.toMatch(/wind will also be added in the future/i);
        expect(content).toMatch(/wind (?:turbines|power)/i);
    });
});
