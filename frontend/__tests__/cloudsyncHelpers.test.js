/**
 * @jest-environment jsdom
 */
import { formatBackupFilename, sanitizeSaveForBackup } from '../src/lib/cloudsync/githubGists.js';

describe('cloudsync helpers', () => {
    test('sanitizeSaveForBackup removes github token without mutating input', () => {
        const input = {
            github: { token: 'secret-token', note: 'keep' },
            inventory: { items: 1 },
            nested: { token: 'strip-me', value: true },
        };
        const snapshot = JSON.parse(JSON.stringify(input));

        const sanitized = sanitizeSaveForBackup(input);

        expect(sanitized.github).toBeUndefined();
        expect(sanitized.inventory.items).toBe(1);
        expect(sanitized.nested.token).toBeUndefined();
        expect(sanitized.nested.value).toBe(true);
        expect(input).toEqual(snapshot);
    });

    test('formatBackupFilename outputs colon-free timestamp', () => {
        const date = new Date('2023-02-01T12:34:56Z');
        const filename = formatBackupFilename(date);
        expect(filename).toBe('dspace-save-2023-02-01T12-34-56Z.txt');
        expect(filename).not.toMatch(/:/);
    });
});
