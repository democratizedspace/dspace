import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('buildInfo', () => {
    let originalViteGitSha;
    const buildMetaFixture = {
        gitSha: 'feedbeefcafef00d',
        generatedAt: '2024-01-01T00:00:00.000Z',
        source: 'git',
    };

    const loadBuildInfo = async (buildMetaOverride = buildMetaFixture) => {
        vi.resetModules();
        vi.doMock('../src/generated/build_meta.json', () => ({
            default: buildMetaOverride,
        }));
        return await import('../src/utils/buildInfo.js');
    };

    beforeEach(() => {
        originalViteGitSha = process.env.VITE_GIT_SHA;
    });

    afterEach(() => {
        if (originalViteGitSha === undefined) {
            delete process.env.VITE_GIT_SHA;
        } else {
            process.env.VITE_GIT_SHA = originalViteGitSha;
        }
        vi.clearAllMocks();
    });

    it('uses build metadata when no VITE build SHA is provided', async () => {
        delete process.env.VITE_GIT_SHA;
        const { getAppGitSha, getPromptVersionSha } = await loadBuildInfo();
        expect(getAppGitSha()).toBe('feedbeefcafef00d');
        expect(getPromptVersionSha()).toBe('feedbee');
    });

    it('uses docs pack fallback when no build SHA is provided', async () => {
        delete process.env.VITE_GIT_SHA;
        const { getAppGitShaWithFallback, getPromptVersionLabelForSha } = await loadBuildInfo({
            gitSha: 'missing',
            generatedAt: '2024-01-01T00:00:00.000Z',
            source: 'unknown',
        });
        expect(getAppGitShaWithFallback('feedface')).toEqual({
            sha: 'feedface',
            source: 'docs-pack-fallback',
        });
        expect(getPromptVersionLabelForSha('feedface')).toBe('v3:feedfac');
    });

    it('returns a short prompt version while preserving the full app SHA', async () => {
        process.env.VITE_GIT_SHA = 'abc123def456';
        const {
            getAppGitSha,
            getPromptVersionSha,
            getPromptVersionLabel,
            getAppGitShaWithFallback,
        } = await loadBuildInfo();
        expect(getAppGitSha()).toBe('abc123def456');
        expect(getPromptVersionSha()).toBe('abc123d');
        expect(getPromptVersionLabel()).toBe('v3:abc123d');
        expect(getAppGitShaWithFallback('feedface')).toEqual({
            sha: 'abc123def456',
            source: 'vite',
        });
    });

    it('prefers the VITE build SHA for production-like builds', async () => {
        process.env.VITE_GIT_SHA = 'feedbeefcafef00d';
        const {
            getPromptVersionLabel,
            getAppGitSha,
            getAppGitShaWithFallback,
            getPromptVersionSha,
        } = await loadBuildInfo();
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

    it('does not return a missing placeholder when VITE_GIT_SHA is set', async () => {
        process.env.VITE_GIT_SHA = 'abc123def456';
        const { getAppGitSha, getPromptVersionLabel, getPromptVersionSha } = await loadBuildInfo();
        expect(getAppGitSha()).toBe('abc123def456');
        expect(getPromptVersionLabel()).toBe('v3:abc123d');
        expect(getPromptVersionSha()).toBe('abc123d');
    });

    it('derives the prompt SHA from an existing prompt label', async () => {
        const { getPromptVersionSha } = await loadBuildInfo();
        expect(getPromptVersionSha('v3:feedface')).toBe('feedfac');
        expect(getPromptVersionSha('v3:dev-local')).toBe('dev-local');
        expect(getPromptVersionSha('v3:missing')).toBe('missing');
    });

    it('derives env names from hostnames', async () => {
        const { deriveEnvNameFromHostname } = await loadBuildInfo();
        expect(deriveEnvNameFromHostname('staging.democratized.space')).toBe('staging');
        expect(deriveEnvNameFromHostname('democratized.space')).toBe('prod');
        expect(deriveEnvNameFromHostname('foo.democratized.space')).toBe('dev');
        expect(deriveEnvNameFromHostname('localhost:3000')).toBe('dev');
        expect(deriveEnvNameFromHostname('example.com')).toBe('dev');
    });

    it('returns missing when both VITE and build metadata are unavailable', async () => {
        delete process.env.VITE_GIT_SHA;
        const { getAppGitSha, getPromptVersionLabel } = await loadBuildInfo({
            gitSha: 'missing',
            generatedAt: '2024-01-01T00:00:00.000Z',
            source: 'unknown',
        });
        expect(getAppGitSha()).toBe('missing');
        expect(getPromptVersionLabel()).toBe('v3:missing');
    });
});
