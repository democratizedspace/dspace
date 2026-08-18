import { createServer, type Server } from 'node:http';

import { expect, test } from '@playwright/test';

import { navigateWithRetry } from './test-helpers';

async function unusedLoopbackPort(): Promise<number> {
    const server = createServer();
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Could not reserve loopback port');
    const { port } = address;
    await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve()))
    );
    return port;
}

async function close(server: Server): Promise<void> {
    if (!server.listening) return;
    await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve()))
    );
}

test.describe('navigateWithRetry real browser path', () => {
    test('recovers from a transient connection refusal and returns the successful response', async ({
        page,
    }) => {
        const port = await unusedLoopbackPort();
        const url = `http://127.0.0.1:${port}/chat`;
        const server = createServer((_request, response) => {
            response.writeHead(200, { 'content-type': 'text/html' });
            response.end('<!doctype html><title>DSPACE retry fixture</title>');
        });
        const originalWarn = console.warn;
        let retryWarnings = 0;
        console.warn = (...args: unknown[]) => {
            retryWarnings += 1;
            server.listen(port, '127.0.0.1');
            originalWarn(...args);
        };

        try {
            const response = await navigateWithRetry(page, url, {
                attempts: 2,
                delayMs: 100,
                maxDurationMs: 2_000,
                attemptTimeoutMs: 1_000,
            });

            expect(retryWarnings).toBe(1);
            expect(response?.status()).toBe(200);
            expect(page.url()).toBe(url);
        } finally {
            console.warn = originalWarn;
            await close(server);
        }
    });

    test('fails closed after the bounded attempts for a persistent connection refusal', async ({
        page,
    }) => {
        const port = await unusedLoopbackPort();
        const url = `http://127.0.0.1:${port}/chat`;

        await expect(
            navigateWithRetry(page, url, {
                attempts: 2,
                delayMs: 10,
                maxDurationMs: 2_000,
                attemptTimeoutMs: 1_000,
            })
        ).rejects.toThrow(`while navigating to ${url} after 2 attempts`);
    });
});
