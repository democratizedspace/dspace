import { describe, expect, it, vi } from 'vitest';
import {
    formatBackupFilename,
    listBackups,
    sanitizeSaveForBackup,
} from '../../src/lib/cloudsync/githubGists';

describe('githubGists helpers', () => {
    it('formats filenames without colons using ISO timestamp', () => {
        const date = new Date('2025-12-22T20:31:12Z');
        expect(formatBackupFilename(date)).toBe('dspace-save-2025-12-22T20-31-12Z.txt');
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

        expect(sanitized.auth.password).toBeUndefined();
        expect(sanitized.auth.apiKey).toBeUndefined();
        expect(sanitized.auth.passphrase).toBeUndefined();
        expect(sanitized.auth.authorization).toBeUndefined();
        expect(sanitized.auth.nested.privateKey).toBeUndefined();
        expect(sanitized.auth.keep).toBe('ok');
        expect(sanitized.array[0].secretKey).toBeUndefined();
        expect(sanitized.array[0].keep).toBe('yep');
        expect(sanitized.array[1].credentialNotes).toBeUndefined();
    });

    it('requests backups with caching disabled', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve([]),
        });

        await listBackups('ghp_test', fetchMock as unknown as typeof fetch);

        expect(fetchMock).toHaveBeenCalledWith(
            'https://api.github.com/gists?per_page=30',
            expect.objectContaining({
                cache: 'no-store',
                headers: expect.objectContaining({
                    'Cache-Control': 'no-cache',
                }),
            })
        );
    });
});
