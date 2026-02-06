import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/generated/build_meta.json', () => ({
    default: {
        gitSha: 'abc123def4567890abc123def4567890abc123de',
        generatedAt: '2025-01-02T03:04:05.000Z',
        source: 'build-meta',
    },
}));

import {
    getAppGitSha,
    getAppGitShaWithFallback,
    getPromptVersionLabel,
} from '../src/utils/buildInfo.js';

const fullSha = 'abc123def4567890abc123def4567890abc123de';
const shortSha = fullSha.slice(0, 7);

describe('buildInfo', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalViteSha = process.env.VITE_GIT_SHA;

    beforeEach(() => {
        process.env.NODE_ENV = 'production';
        delete process.env.VITE_GIT_SHA;
    });

    afterEach(() => {
        if (originalNodeEnv === undefined) {
            delete process.env.NODE_ENV;
        } else {
            process.env.NODE_ENV = originalNodeEnv;
        }
        if (originalViteSha === undefined) {
            delete process.env.VITE_GIT_SHA;
        } else {
            process.env.VITE_GIT_SHA = originalViteSha;
        }
        vi.clearAllMocks();
    });

    it('uses build metadata when VITE_GIT_SHA is missing', () => {
        expect(getAppGitSha()).toBe(fullSha);
        expect(getAppGitShaWithFallback()).toEqual({ sha: fullSha, source: 'build-meta' });
        expect(getPromptVersionLabel()).toBe(`v3:${shortSha}`);
    });

    it('never returns missing when build metadata is present', () => {
        expect(getAppGitSha()).not.toBe('missing');
    });
});
