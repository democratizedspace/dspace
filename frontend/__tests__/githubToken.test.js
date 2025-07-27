const { describe, it, expect } = require('@jest/globals');
const { isValidGitHubToken } = require('../src/utils/githubToken.js');

describe('isValidGitHubToken', () => {
    it('validates typical tokens', () => {
        expect(isValidGitHubToken('ghp_123456789012345678901234567890123456')).toBe(true);
        expect(isValidGitHubToken('github_pat_abcdefghijklmnopqrstuvwxyz12')).toBe(true);
    });

    it('rejects invalid tokens', () => {
        expect(isValidGitHubToken('')).toBe(false);
        expect(isValidGitHubToken('short')).toBe(false);
        expect(isValidGitHubToken('ghp_invalid')).toBe(false);
    });
});
