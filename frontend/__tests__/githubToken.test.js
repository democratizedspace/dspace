/**
 * @jest-environment jsdom
 */
import 'fake-indexeddb/auto';
import {
    loadGitHubToken,
    saveGitHubToken,
    clearGitHubToken,
    isValidGitHubToken,
} from '../src/utils/githubToken.js';
import { loadGameState, resetGameState } from '../src/utils/gameState/common.js';

describe('githubToken utils', () => {
    beforeEach(async () => {
        await resetGameState();
    });

    test('saves and loads token', async () => {
        await saveGitHubToken('abc');
        expect(await loadGitHubToken()).toBe('abc');
        expect(loadGameState().github.token).toBe('abc');
    });

    test('clears token', async () => {
        await saveGitHubToken('xyz');
        await clearGitHubToken();
        expect(await loadGitHubToken()).toBe('');
        expect(loadGameState().github.token).toBe('');
    });

    test('save before init preserves existing state', async () => {
        await new Promise((resolve, reject) => {
            const req = indexedDB.open('dspaceGameState', 1);
            req.onupgradeneeded = () => {
                const db = req.result;
                if (!db.objectStoreNames.contains('state')) db.createObjectStore('state');
                if (!db.objectStoreNames.contains('backup')) db.createObjectStore('backup');
            };
            req.onsuccess = () => {
                const db = req.result;
                const tx = db.transaction('state', 'readwrite');
                tx.objectStore('state').put(
                    { quests: {}, inventory: { a: 1 }, processes: {} },
                    'root'
                );
                tx.oncomplete = resolve;
                tx.onerror = (e) => reject(e.target.error);
            };
            req.onerror = (e) => reject(e.target.error);
        });

        jest.resetModules();
        const {
            saveGitHubToken: saveToken,
            loadGitHubToken: loadToken,
        } = require('../src/utils/githubToken.js');
        const { loadGameState: loadState } = require('../src/utils/gameState/common.js');

        await saveToken('abc');
        expect(loadState().inventory.a).toBe(1);
        expect(await loadToken()).toBe('abc');
    });

    test('validates tokens correctly', () => {
        expect(isValidGitHubToken('ghp_123456789012345678901234567890123456')).toBe(true);
        expect(isValidGitHubToken('github_pat_abcdefghijklmnopqrstuvwxyz12')).toBe(true);
        expect(isValidGitHubToken('')).toBe(false);
        expect(isValidGitHubToken('short')).toBe(false);
        expect(isValidGitHubToken('ghp_invalid')).toBe(false);
    });
});
