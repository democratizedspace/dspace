import { describe, expect, it } from 'vitest';
import { formatBackupFilename, sanitizeSaveForBackup } from '../../src/lib/cloudsync/githubGists';

describe('githubGists helpers', () => {
    it('formats filenames without colons using ISO timestamp', () => {
        const date = new Date('2025-12-22T20:31:12Z');
        expect(formatBackupFilename(date)).toBe('dspace-save-2025-12-22T20-31-12.000Z.txt');
    });

    it('removes secret tokens from saves', () => {
        const save = {
            github: { token: 'secret', keep: 'ok' },
            nested: { sessionToken: 'hidden', value: true },
            quests: { q1: true },
        };

        const sanitized = sanitizeSaveForBackup(save);

        expect(sanitized.github.token).toBeUndefined();
        expect(sanitized.github.keep).toBe('ok');
        expect(sanitized.nested.sessionToken).toBeUndefined();
        expect(sanitized.quests.q1).toBe(true);
        expect(save.github.token).toBe('secret');
    });

    it('scrubs other credential-like fields before upload', () => {
        const save = {
            auth: {
                password: 'hunter2', // scan-secrets: ignore - test fixture
                apiKey: 'abc123', // scan-secrets: ignore - test fixture
                passphrase: 'open-sesame',
                authorization: 'Bearer token',
                nested: { privateKey: 'ssh-rsa AAAA' },
                keep: 'ok',
            },
            array: [
                { secretKey: 'nope', keep: 'yep' }, // scan-secrets: ignore - test fixture
                { credentialNotes: 'password123' }, // scan-secrets: ignore - test fixture
            ],
        };

        const sanitized = sanitizeSaveForBackup(save);

        expect(sanitized.auth?.password).toBeUndefined();
        expect(sanitized.auth?.apiKey).toBeUndefined();
        expect(sanitized.auth?.passphrase).toBeUndefined();
        expect(sanitized.auth?.authorization).toBeUndefined();
        expect(sanitized.auth?.nested?.privateKey).toBeUndefined();
        expect(sanitized.auth).toBeUndefined();
        expect(sanitized.array?.[0]?.secretKey).toBeUndefined();
        expect(sanitized.array?.[0]?.keep).toBe('yep');
        expect(sanitized.array?.[1]?.credentialNotes).toBeUndefined();
    });

    it('retains custom content when sanitizing saves for backup', () => {
        const save = {
            custom: {
                items: [{ id: 'custom-item-1' }],
                processes: [{ id: 'custom-process-1' }],
                quests: [{ id: 'custom-quest-1' }],
            },
            github: { token: 'ghp_secret' },
        };

        const sanitized = sanitizeSaveForBackup(save);

        expect(sanitized.custom?.items).toEqual([{ id: 'custom-item-1' }]);
        expect(sanitized.custom?.processes).toEqual([{ id: 'custom-process-1' }]);
        expect(sanitized.custom?.quests).toEqual([{ id: 'custom-quest-1' }]);
        expect(sanitized.github?.token).toBeUndefined();
    });
});
