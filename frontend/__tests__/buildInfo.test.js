import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
    getAppGitSha,
    getAppGitShaWithFallback,
    getPromptVersionLabelForSha,
    getPromptVersionLabel,
    getPromptVersionSha,
    deriveEnvNameFromHostname,
} from '../src/utils/buildInfo.js';
import buildMeta from '../src/generated/build_meta.json';

describe('buildInfo', () => {
    let originalViteGitSha;

    beforeEach(() => {
        originalViteGitSha = process.env.VITE_GIT_SHA;
    });

    afterEach(() => {
        if (originalViteGitSha === undefined) {
            delete process.env.VITE_GIT_SHA;
        } else {
            process.env.VITE_GIT_SHA = originalViteGitSha;
        }
    });

    it('uses the build meta SHA when no VITE build SHA is provided', () => {
        delete process.env.VITE_GIT_SHA;
        const expectedSha = buildMeta.gitSha;
        const expectedShortSha = expectedSha.length > 7 ? expectedSha.slice(0, 7) : expectedSha;
        expect(getAppGitSha()).toBe(expectedSha);
        expect(getPromptVersionSha()).toBe(expectedShortSha);
    });

    it('uses build meta for app SHA when no VITE build SHA is provided', () => {
        delete process.env.VITE_GIT_SHA;
        expect(getAppGitShaWithFallback('feedface')).toEqual({
            sha: buildMeta.gitSha,
            source: 'vite',
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

    it('does not return a missing placeholder when VITE_GIT_SHA is set', () => {
        process.env.VITE_GIT_SHA = 'abc123def456';
        expect(getAppGitSha()).toBe('abc123def456');
        expect(getPromptVersionLabel()).toBe('v3:abc123d');
        expect(getPromptVersionSha()).toBe('abc123d');
    });

    it('derives the prompt SHA from an existing prompt label', () => {
        expect(getPromptVersionSha('v3:feedface')).toBe('feedfac');
        expect(getPromptVersionSha('v3:dev-local')).toBe('dev-local');
    });

    it('does not return missing when build meta is available', () => {
        delete process.env.VITE_GIT_SHA;
        expect(getPromptVersionLabel()).not.toBe('v3:missing');
        expect(getPromptVersionSha()).not.toBe('missing');
    });

    it('derives env names from hostnames', () => {
        expect(deriveEnvNameFromHostname('staging.democratized.space')).toBe('staging');
        expect(deriveEnvNameFromHostname('democratized.space')).toBe('prod');
        expect(deriveEnvNameFromHostname('foo.democratized.space')).toBe('dev');
        expect(deriveEnvNameFromHostname('localhost:3000')).toBe('dev');
        expect(deriveEnvNameFromHostname('example.com')).toBe('dev');
    });
});
