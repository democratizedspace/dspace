import { afterEach, describe, expect, it } from 'vitest';

import { getAppGitSha, getPromptVersionSha } from '../src/utils/buildInfo.js';

describe('buildInfo', () => {
    afterEach(() => {
        delete process.env.VITE_GIT_SHA;
    });

    it('falls back to dev-local when no build SHA is provided', () => {
        delete process.env.VITE_GIT_SHA;
        expect(getAppGitSha()).toBe('dev-local');
        expect(getPromptVersionSha()).toBe('dev-local');
    });

    it('returns a short prompt version while preserving the full app SHA', () => {
        process.env.VITE_GIT_SHA = 'abc123def456';
        expect(getAppGitSha()).toBe('abc123def456');
        expect(getPromptVersionSha()).toBe('abc123d');
    });
});
