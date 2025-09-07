/**
 * @jest-environment jsdom
 */
import 'fake-indexeddb/auto';

test('saving token before init preserves existing state', async () => {
    await new Promise((resolve) => {
        const req = indexedDB.deleteDatabase('dspaceGameState');
        req.onsuccess = resolve;
        req.onerror = resolve;
    });

    await new Promise((resolve, reject) => {
        const req = indexedDB.open('dspaceGameState', 1);
        req.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('state')) db.createObjectStore('state');
            if (!db.objectStoreNames.contains('backup')) db.createObjectStore('backup');
        };
        req.onsuccess = () => {
            const db = req.result;
            const tx = db.transaction('state', 'readwrite');
            tx.objectStore('state').put(
                { quests: { q: { finished: true } }, inventory: {}, processes: {} },
                'root'
            );
            tx.oncomplete = () => {
                db.close();
                resolve();
            };
            tx.onerror = () => reject(tx.error);
        };
        req.onerror = () => reject(req.error);
    });

    const { saveGitHubToken, loadGitHubToken } = await import('../src/utils/githubToken.js');
    const { loadGameState } = await import('../src/utils/gameState/common.js');

    await saveGitHubToken('abc');
    expect(await loadGitHubToken()).toBe('abc');
    const state = loadGameState();
    expect(state.quests.q.finished).toBe(true);
});
