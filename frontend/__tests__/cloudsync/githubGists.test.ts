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

    it('lists backups when filenames are only present in file metadata', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => [
                {
                    id: 'gist-123',
                    created_at: '2026-01-21T09:10:38Z',
                    html_url: 'https://gist.github.com/gist-123',
                    description: '',
                    files: {
                        blob: { filename: 'dspace-save-2026-01-21T09-10-38Z.txt' },
                    },
                },
            ],
        });

        const backups = await listBackups('ghp_valid', fetchMock);

        expect(fetchMock).toHaveBeenCalledWith('https://api.github.com/gists?per_page=30', {
            headers: {
                Authorization: 'token ghp_valid',
                Accept: 'application/vnd.github+json',
            },
            cache: 'no-store',
        });
        expect(backups).toEqual([
            {
                id: 'gist-123',
                createdAt: '2026-01-21T09:10:38Z',
                htmlUrl: 'https://gist.github.com/gist-123',
                filename: 'dspace-save-2026-01-21T09-10-38Z.txt',
            },
        ]);
    });
});
