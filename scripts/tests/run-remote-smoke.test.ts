import { describe, expect, it } from 'vitest';

import { parseArgs } from '../../scripts/run-remote-smoke.mjs';

describe('run-remote-smoke argument parsing', () => {
    it('enables custom-item mutation by default', () => {
        const parsed = parseArgs(['--baseURL=http://127.0.0.1:4173']);

        expect(parsed.mutate).toBe(true);
        expect(parsed.mutationMode).toBe('default-on');
    });

    it('supports explicit non-mutating mode via --no-mutate', () => {
        const parsed = parseArgs(['--baseURL=http://127.0.0.1:4173', '--no-mutate']);

        expect(parsed.mutate).toBe(false);
        expect(parsed.mutationMode).toBe('forced-off');
    });

    it('supports --safe alias for non-mutating mode', () => {
        const parsed = parseArgs(['--baseURL=http://127.0.0.1:4173', '--safe']);

        expect(parsed.mutate).toBe(false);
        expect(parsed.mutationMode).toBe('safe-mode');
    });
});
