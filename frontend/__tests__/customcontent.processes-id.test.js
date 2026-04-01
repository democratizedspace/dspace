/**
 * @jest-environment jsdom
 */
import 'fake-indexeddb/auto';
import { db } from '../src/utils/customcontent.js';

describe('Custom content process ID generation', () => {
    const processPayload = {
        title: 'T',
        duration: 60,
        requireItems: [],
        consumeItems: [],
        createItems: [],
    };

    test('db.processes.add generates an id when omitted', async () => {
        const id = await db.processes.add({ ...processPayload });
        const storedProcess = await db.processes.get(id);

        expect(typeof storedProcess.id).toBe('string');
        expect(storedProcess.id.length).toBeGreaterThan(0);
        expect(storedProcess.id).toBe(id);
    });

    test('db.processes.add falls back when crypto.randomUUID is unavailable', async () => {
        const originalCrypto = globalThis.crypto;

        Object.defineProperty(globalThis, 'crypto', {
            value: {},
            configurable: true,
        });

        try {
            const id = await db.processes.add({ ...processPayload });
            const storedProcess = await db.processes.get(id);

            expect(storedProcess.id).toMatch(
                /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
            );
            expect(storedProcess.id).toBe(id);
        } finally {
            Object.defineProperty(globalThis, 'crypto', {
                value: originalCrypto,
                configurable: true,
            });
        }
    });
});
