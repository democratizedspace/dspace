import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Docs link checker', () => {
    it('passes for internal markdown links', () => {
        const scriptPath = path.resolve('scripts/link-check.mjs');
        const output = execFileSync('node', [scriptPath], { encoding: 'utf8' });

        expect(output).toMatch(/All local markdown links resolved/);
    });
});
