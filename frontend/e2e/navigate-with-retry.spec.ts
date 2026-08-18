import { createServer, type Server } from 'node:http';

import { expect, test } from '@playwright/test';

import { navigateWithRetry } from './test-helpers';

async function reservePort(): Promise<number> {
    const server = createServer();
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Failed to reserve a test port');
    const { port } = address;
    await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve()))
    );
    return port;
}

test.describe('navigateWithRetry browser integration', () => {
    let server: Server | undefined;

    test.afterEach(async () => {
        if (server?.listening) {
            await new Promise<void>((resolve, reject) =>
                server?.close((error) => (error ? reject(error) : resolve()))
            );
        }
        server = undefined;
    });

    test('recovers through the real page navigation path after a transient refusal', async ({
        page,
    }) => {
        const port = await reservePort();
        const url = `http://127.0.0.1:${port}/chat`;
        server = createServer((_request, response) => {
            response.writeHead(200, { 'content-type': 'text/html' });
            response.end('<title>identity retry reached chat</title>');
        });
        setTimeout(() => server?.listen(port, '127.0.0.1'), 100);

        const warnings: string[] = [];
        const originalWarn = console.warn;
        console.warn = (message) => warnings.push(String(message));
        let response;
        try {
            response = await navigateWithRetry(page, url, {
                attempts: 2,
                delayMs: 300,
                maxDurationMs: 5_000,
            });
        } finally {
            console.warn = originalWarn;
        }

        expect(response?.status()).toBe(200);
        expect(warnings).toEqual([
            `Retrying navigation to ${url} after connection refusal (attempt 1 of 2)`,
        ]);
        await expect(page).toHaveTitle('identity retry reached chat');
    });

    test('fails after bounded real navigation attempts when refusal persists', async ({ page }) => {
        const port = await reservePort();
        const url = `http://127.0.0.1:${port}/chat`;

        await expect(
            navigateWithRetry(page, url, {
                attempts: 2,
                delayMs: 1,
                maxDurationMs: 5_000,
            })
        ).rejects.toThrow(`while navigating to ${url} after 2 attempts`);
    });
});
