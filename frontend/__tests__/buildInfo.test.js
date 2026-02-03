import { afterEach, describe, expect, it } from 'vitest';

import {
    deriveEnvNameFromHostname,
    getAppGitSha,
    getAppGitShaWithFallback,
    getPromptVersionLabel,
    getPromptVersionSha,
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

    it('returns a short prompt version while preserving the full app SHA', () => {
        process.env.VITE_GIT_SHA = 'abc123def456';
        expect(getAppGitSha()).toBe('abc123def456');
        expect(getPromptVersionSha()).toBe('abc123d');
        expect(getPromptVersionLabel()).toBe('v3:abc123d');
    });

    it('derives the prompt SHA from an existing prompt label', () => {
        expect(getPromptVersionSha('v3:feedface')).toBe('feedfac');
        expect(getPromptVersionSha('v3:dev-local')).toBe('dev-local');
    });

    it('uses docs pack SHAs as a fallback for app build display', () => {
        delete process.env.VITE_GIT_SHA;
        expect(getAppGitShaWithFallback('docs123')).toEqual({
            sha: 'docs123',
            source: 'docs-pack-fallback',
        });
    });

    it('prefers VITE_GIT_SHA over fallback data', () => {
        process.env.VITE_GIT_SHA = 'abc123def456';
        expect(getAppGitShaWithFallback('docs123')).toEqual({
            sha: 'abc123def456',
            source: 'vite',
        });
    });

    it('derives env names from hostnames', () => {
        expect(deriveEnvNameFromHostname('staging.demo.local')).toBe('staging');
        expect(deriveEnvNameFromHostname('democratized.space')).toBe('prod');
        expect(deriveEnvNameFromHostname('localhost:4321')).toBe('dev');
        expect(deriveEnvNameFromHostname('example.com')).toBe('dev');
    });
});
