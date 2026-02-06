import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const loadBuildInfo = async (buildMetaOverride) => {
    vi.resetModules();
    if (buildMetaOverride) {
        vi.doMock('../src/generated/build_meta.json', () => ({ default: buildMetaOverride }));
    } else {
        vi.doMock('../src/generated/build_meta.json', async () => {
            const actual = await vi.importActual('../src/generated/build_meta.json');
            return { default: actual.default ?? actual };
        });
    }
    return await import('../src/utils/buildInfo.js');
};

describe('buildInfo', () => {
    let originalViteGitSha;
    let originalNodeEnv;

    beforeEach(() => {
        originalViteGitSha = process.env.VITE_GIT_SHA;
        originalNodeEnv = process.env.NODE_ENV;
    });

    afterEach(() => {
        if (originalViteGitSha === undefined) {
            delete process.env.VITE_GIT_SHA;
        } else {
            process.env.VITE_GIT_SHA = originalViteGitSha;
        }
        if (originalNodeEnv === undefined) {
            delete process.env.NODE_ENV;
        } else {
            process.env.NODE_ENV = originalNodeEnv;
        }
    });

    it('falls back to build metadata when no build SHA is provided', async () => {
        delete process.env.VITE_GIT_SHA;
        process.env.NODE_ENV = 'production';
        const buildMeta = {
            gitSha: 'abc123def456',
            generatedAt: '2026-02-06T05:16:45.000Z',
            source: 'build-meta',
        };
        const {
            getAppGitSha,
            getAppGitShaWithFallback,
            getPromptVersionLabel,
            getPromptVersionSha,
        } = await loadBuildInfo(buildMeta);
        expect(getAppGitSha()).toBe(buildMeta.gitSha);
        expect(getAppGitSha()).not.toBe('missing');
        expect(getAppGitShaWithFallback()).toEqual({
            sha: buildMeta.gitSha,
            source: 'build-meta',
        });
        expect(getPromptVersionSha()).toBe(buildMeta.gitSha.slice(0, 7));
        expect(getPromptVersionLabel()).toBe(`v3:${buildMeta.gitSha.slice(0, 7)}`);
    });

    it('uses docs pack fallback when no build SHA is provided', async () => {
        delete process.env.VITE_GIT_SHA;
        process.env.NODE_ENV = 'development';
        const { getAppGitShaWithFallback, getPromptVersionLabelForSha } = await loadBuildInfo({
            gitSha: 'abc123def456',
            generatedAt: '2026-02-06T05:16:45.000Z',
            source: 'git',
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
            getPromptVersionLabel,
            getPromptVersionSha,
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
            getAppGitSha,
            getAppGitShaWithFallback,
            getPromptVersionLabel,
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
    });

    it('derives env names from hostnames', async () => {
        const { deriveEnvNameFromHostname } = await loadBuildInfo();
        expect(deriveEnvNameFromHostname('staging.democratized.space')).toBe('staging');
        expect(deriveEnvNameFromHostname('democratized.space')).toBe('prod');
        expect(deriveEnvNameFromHostname('foo.democratized.space')).toBe('dev');
        expect(deriveEnvNameFromHostname('localhost:3000')).toBe('dev');
        expect(deriveEnvNameFromHostname('example.com')).toBe('dev');
    });
});
