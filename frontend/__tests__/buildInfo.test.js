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

    it('uses docs metadata as a fallback for the app SHA when missing', () => {
        delete process.env.VITE_GIT_SHA;
        expect(getAppGitShaWithFallback('docs789')).toEqual({
            sha: 'docs789',
            source: 'docs-pack-fallback',
        });
        expect(getAppGitShaWithFallback('unknown')).toEqual({
            sha: 'dev-local',
            source: 'dev-local',
        });
    });

    it('derives environment names from hostnames', () => {
        expect(deriveEnvNameFromHostname('staging.democratized.space')).toBe('staging');
        expect(deriveEnvNameFromHostname('democratized.space')).toBe('prod');
        expect(deriveEnvNameFromHostname('preview.example.com')).toBe('dev');
        expect(deriveEnvNameFromHostname('localhost:3000')).toBe('dev');
    });

    it('derives the prompt SHA from an existing prompt label', () => {
        expect(getPromptVersionSha('v3:feedface')).toBe('feedfac');
        expect(getPromptVersionSha('v3:dev-local')).toBe('dev-local');
    });
});
