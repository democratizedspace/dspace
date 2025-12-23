import { describe, expect, it } from 'vitest';
import { formatBackupFilename, sanitizeSaveForBackup } from '../src/lib/cloudsync/githubGists';

describe('githubGists helpers', () => {
    it('removes github token from backup payload without mutation', () => {
        const source = {
            github: { token: 'secret', note: 'keep' },
            session: { refreshToken: 'nope' },
            quests: { mission: true },
        };

        const copy = structuredClone(source);
        const sanitized = sanitizeSaveForBackup(source);

        expect(sanitized.github?.token).toBeUndefined();
        expect(sanitized.github?.note).toBe('keep');
        expect(sanitized.session?.refreshToken).toBeUndefined();
        expect(source).toEqual(copy);
    });

    it('formats backup filename without colons', () => {
        const date = new Date('2025-12-22T20:31:12Z');
        const filename = formatBackupFilename(date);

        expect(filename).toBe('dspace-save-2025-12-22T20-31-12Z.txt');
        expect(filename.includes(':')).toBe(false);
    });
});
