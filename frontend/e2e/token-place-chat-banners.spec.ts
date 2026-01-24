import { expect, test, type Page } from '@playwright/test';

import { clearUserData, waitForHydration } from './test-helpers';

type TokenPlaceStubMode = 'network-error' | 'provider-error' | 'unknown-error';

const installTokenPlaceStub = async (page: Page, mode: TokenPlaceStubMode) => {
    await page.addInitScript(
        ({ stubMode }) => {
            const originalFetch = window.fetch.bind(window);
            window.fetch = async (input, init) => {
                const url = typeof input === 'string' ? input : input?.url;

                if (typeof url === 'string' && url.includes('token.place')) {
                    if (stubMode === 'network-error') {
                        throw new Error('Failed to fetch');
                    }

                    if (stubMode === 'provider-error') {
                        return {
                            ok: false,
                            statusText: 'Bad Request',
                            json: async () => ({ error: 'provider down' }),
                        };
                    }

                    if (stubMode === 'unknown-error') {
                        throw new Error('Unexpected token.place failure');
                    }
                }

                return originalFetch(input, init);
            };
        },
        { stubMode: mode }
    );
};

const seedTokenPlaceEnabledState = async (page: Page) => {
    await page.addInitScript(() => {
        const state = {
            tokenPlace: { enabled: true },
            quests: {},
            inventory: {},
            processes: {},
            settings: {},
            versionNumberString: '3',
            _meta: { lastUpdated: Date.now() },
        };
        localStorage.setItem('gameState', JSON.stringify(state));
    });
};

const openTokenPlacePanel = async (page: Page) => {
    await page.goto('/chat');
    await waitForHydration(page);

    const chatPanel = page.locator('[data-testid="chat-panel"][data-provider="token-place"]');
    await expect(chatPanel).toBeVisible();
    const messageBox = chatPanel.getByRole('textbox');
    await expect(messageBox).toBeEnabled();

    return {
        chatPanel,
        spinner: chatPanel.locator('.spinner-container'),
        messageBox,
    };
};

const sendMessage = async (page: Page, text: string) => {
    const { chatPanel, spinner, messageBox } = await openTokenPlacePanel(page);
    await messageBox.fill(text);
    await chatPanel.getByRole('button', { name: 'Send' }).click();
    await expect(chatPanel.getByText(text)).toBeVisible();

    return { chatPanel, spinner };
};

test.describe('Token.place chat error banners', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('shows a network banner when token.place is unreachable', async ({ page }) => {
        await installTokenPlaceStub(page, 'network-error');
        await seedTokenPlaceEnabledState(page);

        const { chatPanel, spinner } = await sendMessage(page, 'Trigger token.place network error');

        const banner = chatPanel.locator('.chat-error');
        await expect(banner).toHaveAttribute('data-error-type', 'network');
        await expect(banner).toContainText(/could not reach token\.place/i);
        await expect(spinner).not.toBeVisible();
    });

    test('shows a provider banner when token.place returns an error', async ({ page }) => {
        await installTokenPlaceStub(page, 'provider-error');
        await seedTokenPlaceEnabledState(page);

        const { chatPanel, spinner } = await sendMessage(
            page,
            'Trigger token.place provider error'
        );

        const banner = chatPanel.locator('.chat-error');
        await expect(banner).toHaveAttribute('data-error-type', 'provider');
        await expect(banner).toContainText(/token\.place returned an error/i);
        await expect(spinner).not.toBeVisible();
    });

    test('shows an unknown banner for unexpected token.place errors', async ({ page }) => {
        await installTokenPlaceStub(page, 'unknown-error');
        await seedTokenPlaceEnabledState(page);

        const { chatPanel, spinner } = await sendMessage(page, 'Trigger token.place unknown error');

        const banner = chatPanel.locator('.chat-error');
        await expect(banner).toHaveAttribute('data-error-type', 'unknown');
        await expect(banner).toContainText(/token\.place hit an unexpected error/i);
        await expect(spinner).not.toBeVisible();
    });
});
