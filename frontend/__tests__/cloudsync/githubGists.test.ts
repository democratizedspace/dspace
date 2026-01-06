import { describe, expect, it } from 'vitest';
import { formatBackupFilename, sanitizeSaveForBackup } from '../../src/lib/cloudsync/githubGists';

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

    it('retains custom items, processes, and quests when sanitizing backups', () => {
        const customContent = {
            items: [{ id: 'custom-item-1', name: 'Custom Item' }],
            processes: [
                {
                    id: 'custom-process-1',
                    name: 'Custom Process',
                    consumes: [{ id: 'item', qty: 1 }],
                },
            ],
            quests: [
                { id: 'custom-quest-1', title: 'Custom Quest', requiresQuests: ['core/intro'] },
            ],
        };

        const save = {
            custom: customContent,
            openAI: { apiKey: 'sk-secret' }, // scan-secrets: ignore - test fixture
            inventory: { items: { 'core/intro': 1 } },
        };

        const sanitized = sanitizeSaveForBackup(save);

        expect(sanitized.custom).toEqual(customContent);
        expect(sanitized.inventory).toEqual({ items: { 'core/intro': 1 } });
        expect(sanitized.openAI).toBeUndefined();
        expect(save.custom).toBe(customContent);
    });
});
