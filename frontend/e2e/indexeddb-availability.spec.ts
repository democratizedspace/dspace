import { expect, test } from '@playwright/test';

test.describe('IndexedDB availability', () => {
    test('does not trigger fallback alert when IndexedDB is available', async ({ page }) => {
        const dialogs: string[] = [];

        page.on('dialog', async (dialog) => {
            dialogs.push(dialog.message());
            await dialog.dismiss();
        });

        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Allow async initialization to surface any late fallback dialogs.
        await page.waitForTimeout(1000);
        expect(dialogs).toHaveLength(0);

        const indexedDbProbe = await page.evaluate(async () => {
            const supportsIndexedDb = typeof indexedDB !== 'undefined';
            if (!supportsIndexedDb) {
                return { supportsIndexedDb, canOpenDatabase: false, hasLightweightSnapshot: false };
            }

            const canOpenDatabase = await new Promise<boolean>((resolve) => {
                const request = indexedDB.open('dspaceGameState');
                request.onsuccess = () => {
                    request.result.close();
                    resolve(true);
                };
                request.onerror = () => resolve(false);
            });

            const hasLightweightSnapshot = await new Promise<boolean>((resolve) => {
                const maxWaitMs = 5000;
                const pollIntervalMs = 100;
                const startTime = Date.now();

                const check = () => {
                    if (localStorage.getItem('gameStateLite')) {
                        resolve(true);
                        return;
                    }

                    if (Date.now() - startTime >= maxWaitMs) {
                        resolve(false);
                        return;
                    }

                    setTimeout(check, pollIntervalMs);
                };

                check();
            });

            return { supportsIndexedDb, canOpenDatabase, hasLightweightSnapshot };
        });

        expect(indexedDbProbe.supportsIndexedDb).toBe(true);
        expect(indexedDbProbe.canOpenDatabase).toBe(true);
        expect(indexedDbProbe.hasLightweightSnapshot).toBe(true);
    });

    test.describe('localStorage fallback', () => {
        test.use({ serviceWorkers: 'block' });
        test.skip(
            ({ baseURL }) =>
                !baseURL ||
                !['127.0.0.1', 'localhost', '[::1]'].includes(new URL(baseURL).hostname),
            'IndexedDB fault simulation is only run against a loopback app origin.'
        );

        test('keeps the selected chat provider across reload when IndexedDB is blocked', async ({
            baseURL,
            page,
        }) => {
            const localURL = new URL(baseURL || '');
            await page.route('**/*', (route) =>
                new URL(route.request().url()).origin === localURL.origin
                    ? route.continue()
                    : route.abort()
            );
            await page.addInitScript(() => {
                Object.defineProperty(IDBFactory.prototype, 'open', {
                    configurable: true,
                    value: () => {
                        throw new DOMException(
                            'IndexedDB is blocked in this profile',
                            'SecurityError'
                        );
                    },
                });
            });
            page.on('dialog', (dialog) => dialog.dismiss());

            await page.goto('/settings');
            const panel = page.getByTestId('chat-provider-settings');
            await expect(panel).toHaveAttribute('data-hydrated', 'true');
            const selectedProvider = panel.locator('input[name="chat-provider"]:checked');
            await expect(selectedProvider).toHaveValue(/^(token-place|openai)$/);
            const nextProvider =
                (await selectedProvider.inputValue()) === 'token-place' ? 'openai' : 'token-place';
            const nextOption = panel.locator(
                `input[name="chat-provider"][value="${nextProvider}"]`
            );
            await nextOption.check();

            await expect
                .poll(() =>
                    page.evaluate(() => JSON.parse(localStorage.getItem('gameState') || '{}'))
                )
                .toMatchObject({
                    settings: { chatProvider: nextProvider },
                    _meta: { chatProviderExplicit: true },
                });

            await page.reload();
            await expect(nextOption).toBeChecked();
            if (nextProvider === 'openai') {
                await expect(page.getByLabel('OpenAI API key', { exact: true })).toBeVisible();
            } else {
                await expect(page.getByTestId('token-place-no-key-note')).toBeVisible();
            }
        });
    });
});
