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
        expect(getAppGitShaWithFallback('feedface', { hostname: 'localhost:3000' })).toEqual({
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

    it('prefers the VITE build SHA for production-like builds', () => {
        process.env.VITE_GIT_SHA = 'feedbeefcafef00d';
        const promptLabel = getPromptVersionLabel();
        expect(getAppGitSha()).toBe('feedbeefcafef00d');
        const appShaWithFallback = getAppGitShaWithFallback('docs-pack-sha');
        expect(appShaWithFallback).toEqual({
            sha: 'feedbeefcafef00d',
            source: 'vite',
        });
        expect(appShaWithFallback.source).not.toBe('docs-pack-fallback');
        expect(getPromptVersionSha()).toBe('feedbee');
        expect(promptLabel).toBe('v3:feedbee');
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

    it('marks missing app SHAs in staging/prod hosts', () => {
        delete process.env.VITE_GIT_SHA;
        expect(
            getAppGitShaWithFallback('feedface', { hostname: 'staging.democratized.space' })
        ).toEqual({
            sha: 'missing',
            source: 'missing',
        });
        expect(getAppGitShaWithFallback('feedface', { hostname: 'democratized.space' })).toEqual({
            sha: 'missing',
            source: 'missing',
        });
    });
});
