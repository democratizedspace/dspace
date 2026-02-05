import { afterEach, describe, expect, it, vi } from 'vitest';

describe('build info', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
        vi.resetModules();
    });

    it('uses the VITE_GIT_SHA when provided', async () => {
        vi.stubEnv('VITE_GIT_SHA', 'deadbeefcafebabe');
        vi.resetModules();
        const { getAppGitShaWithFallback, getPromptVersionLabel } = await import(
            '../frontend/src/utils/buildInfo.js'
        );

        expect(getAppGitShaWithFallback('missing-sha')).toEqual({
            sha: 'deadbeefcafebabe',
            source: 'vite',
        });
        expect(getPromptVersionLabel()).toBe('v3:deadbee');
    });
});
