const { jest } = require('@jest/globals');
require('fake-indexeddb/auto');

describe('game state localStorage migration', () => {
    beforeEach(async () => {
        localStorage.clear();
        await new Promise((resolve) => {
            const req = indexedDB.deleteDatabase('dspaceGameState');
            req.onsuccess = () => resolve();
            req.onerror = () => resolve();
        });
        jest.resetModules();
    });

    test('migrates v2 data to IndexedDB and upgrades version', async () => {
        const legacyState = { quests: {}, inventory: { 1: 1 }, versionNumberString: '2' };
        const legacyBackup = { quests: {}, inventory: { 1: 0 }, processes: {} };
        localStorage.setItem('gameState', JSON.stringify(legacyState));
        localStorage.setItem('gameStateBackup', JSON.stringify(legacyBackup));
        const mod = require('../../src/utils/gameState/common.js');
        await mod.ready;
        const loaded = mod.loadGameState();
        expect(loaded.versionNumberString).toBe('3');
        expect(loaded.inventory['1']).toBe(1);
        expect(localStorage.getItem('gameState')).toBeNull();
        expect(localStorage.getItem('gameStateBackup')).toBeNull();
        const backup = await new Promise((resolve, reject) => {
            const req = indexedDB.open('dspaceGameState', 1);
            req.onsuccess = () => {
                const db = req.result;
                const tx = db.transaction('backup', 'readonly');
                const getReq = tx.objectStore('backup').get('root');
                getReq.onsuccess = () => {
                    resolve(getReq.result);
                    db.close();
                };
                getReq.onerror = (e) => reject(e.target.error);
            };
            req.onerror = (e) => reject(e.target.error);
        });
        expect(backup.inventory['1']).toBe(0);
    });
});
