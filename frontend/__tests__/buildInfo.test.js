import { afterEach, describe, expect, it } from 'vitest';

import {
    getAppGitSha,
    getAppGitShaWithFallback,
    getPromptVersionLabelForSha,
    getPromptVersionLabel,
    getPromptVersionSha,
    deriveEnvNameFromHostname,
} from '../src/utils/buildInfo.js';

describe('buildInfo', () => {
    afterEach(() => {
        delete process.env.VITE_GIT_SHA;
    });

    it('falls back to dev-local when no build SHA is provided', () => {
        delete process.env.VITE_GIT_SHA;
        expect(getAppGitSha()).toBe('dev-local');
        expect(getPromptVersionSha()).toBe('dev-local');
    });

    it('uses docs pack fallback when no build SHA is provided', () => {
        delete process.env.VITE_GIT_SHA;
        expect(getAppGitShaWithFallback('feedface')).toEqual({
            sha: 'feedface',
            source: 'docs-pack-fallback',
        });
        expect(getPromptVersionLabelForSha('feedface')).toBe('v3:feedfac');
    });

    it('returns a short prompt version while preserving the full app SHA', () => {
        process.env.VITE_GIT_SHA = 'abc123def456';
        expect(getAppGitSha()).toBe('abc123def456');
        expect(getPromptVersionSha()).toBe('abc123d');
        expect(getPromptVersionLabel()).toBe('v3:abc123d');
        expect(getAppGitShaWithFallback('feedface')).toEqual({
            sha: 'abc123def456',
            source: 'vite',
        });
    });

    it('uses the baked build SHA for prompt metadata in production builds', () => {
        process.env.VITE_GIT_SHA = 'feedfacebead1234';
        expect(getAppGitSha()).toBe('feedfacebead1234');
        expect(getAppGitShaWithFallback('docs-pack-fallback')).toEqual({
            sha: 'feedfacebead1234',
            source: 'vite',
        });
        expect(getPromptVersionLabel()).toBe('v3:feedfac');
        expect(getPromptVersionLabel()).not.toContain('dev-local');
    });

    it('derives the prompt SHA from an existing prompt label', () => {
        expect(getPromptVersionSha('v3:feedface')).toBe('feedfac');
        expect(getPromptVersionSha('v3:dev-local')).toBe('dev-local');
    });

    it('derives env names from hostnames', () => {
        expect(deriveEnvNameFromHostname('staging.democratized.space')).toBe('staging');
        expect(deriveEnvNameFromHostname('democratized.space')).toBe('prod');
        expect(deriveEnvNameFromHostname('foo.democratized.space')).toBe('prod');
        expect(deriveEnvNameFromHostname('localhost:3000')).toBe('dev');
        expect(deriveEnvNameFromHostname('example.com')).toBe('dev');
    });
});
