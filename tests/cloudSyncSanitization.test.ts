import { describe, expect, it } from 'vitest';
import { sanitizeSaveForBackup } from '../frontend/src/lib/cloudsync/githubGists';

describe('cloud sync sanitization', () => {
    it('removes credential-like fields before uploading backups', () => {
        const save = {
            github: { token: 'secret', keep: 'ok' }, // scan-secrets: ignore - test fixture
            auth: {
                password: 'hunter2', // scan-secrets: ignore - test fixture
                apiKey: 'abc123', // scan-secrets: ignore - test fixture
                passphrase: 'open-sesame',
                authorization: 'Bearer token',
                nested: { privateKey: 'ssh-rsa AAAA' },
            },
            array: [
                { secretKey: 'nope', keep: 'yep' }, // scan-secrets: ignore - test fixture
                { credentialNotes: 'remove me' },
            ],
        };

        const sanitized = sanitizeSaveForBackup(save);

        expect(sanitized.github.token).toBeUndefined();
        expect(sanitized.github.keep).toBe('ok');
        expect(sanitized.auth.password).toBeUndefined();
        expect(sanitized.auth.apiKey).toBeUndefined();
        expect(sanitized.auth.passphrase).toBeUndefined();
        expect(sanitized.auth.authorization).toBeUndefined();
        expect(sanitized.auth.nested.privateKey).toBeUndefined();
        expect(sanitized.array[0].secretKey).toBeUndefined();
        expect(sanitized.array[0].keep).toBe('yep');
        expect(sanitized.array[1].credentialNotes).toBeUndefined();
        expect(save.auth.password).toBe('hunter2');
    });
});
