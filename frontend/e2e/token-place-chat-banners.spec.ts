import { expect, test, type Page } from '@playwright/test';

import { clearUserData, waitForHydration } from './test-helpers';

type TokenPlaceStubMode =
    | 'network-error'
    | 'content-policy'
    | 'rate-limit'
    | 'server-error'
    | 'malformed'
    | 'provider-error'
    | 'unknown-error';

const installTokenPlaceStub = async (page: Page, mode: TokenPlaceStubMode) => {
    await page.route('https://token.place/api/v1/chat/completions', async (route) => {
        if (mode === 'network-error') {
            await route.abort('failed');
            return;
        }

        if (mode === 'unknown-error') {
            await route.abort('connectionreset');
            return;
        }

        if (mode === 'malformed') {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ choices: [{ message: { role: 'assistant' } }] }),
            });
            return;
        }

        const errorPayloads = {
            'content-policy': {
                status: 400,
                body: {
                    error: {
                        message: 'blocked by policy',
                        type: 'content_policy_violation',
                        code: 'content_blocked',
                    },
                },
            },
            'rate-limit': {
                status: 429,
                body: { error: { message: 'daily quota exceeded', type: 'rate_limit' } },
            },
            'server-error': {
                status: 503,
                body: { error: { message: 'upstream unavailable', type: 'server_error' } },
            },
            'provider-error': {
                status: 400,
                body: { error: { message: 'provider down', type: 'invalid_request_error' } },
            },
        } as const;
        const payload = errorPayloads[mode];
        await route.fulfill({
            status: payload.status,
            contentType: 'application/json',
            body: JSON.stringify(payload.body),
        });
    });
};

const seedTokenPlaceEnabledState = async (page: Page) => {
    await page.addInitScript(() => {
        const state = {
            tokenPlace: { enabled: true },
            quests: {},
            inventory: {},
            processes: {},
            settings: { chatProvider: 'token-place' },
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

    test('shows a content-policy-safe banner for blocked content', async ({ page }) => {
        await installTokenPlaceStub(page, 'content-policy');
        await seedTokenPlaceEnabledState(page);

        const { chatPanel, spinner } = await sendMessage(page, 'Trigger blocked content');

        const banner = chatPanel.locator('.chat-error');
        await expect(banner).toHaveAttribute('data-error-type', 'content_policy');
        await expect(banner).toContainText(/content policy/i);
        await expect(spinner).not.toBeVisible();
    });

    test('shows a rate/quota banner for HTTP 429', async ({ page }) => {
        await installTokenPlaceStub(page, 'rate-limit');
        await seedTokenPlaceEnabledState(page);

        const { chatPanel, spinner } = await sendMessage(page, 'Trigger token.place rate limit');

        const banner = chatPanel.locator('.chat-error');
        await expect(banner).toHaveAttribute('data-error-type', 'rate_limit');
        await expect(banner).toContainText(/busy|quota|rate/i);
        await expect(spinner).not.toBeVisible();
    });

    test('shows a server unavailable banner for HTTP 5xx', async ({ page }) => {
        await installTokenPlaceStub(page, 'server-error');
        await seedTokenPlaceEnabledState(page);

        const { chatPanel, spinner } = await sendMessage(page, 'Trigger token.place server error');

        const banner = chatPanel.locator('.chat-error');
        await expect(banner).toHaveAttribute('data-error-type', 'server');
        await expect(banner).toContainText(/temporarily unavailable|server/i);
        await expect(spinner).not.toBeVisible();
    });

    test('shows a malformed/provider response banner for invalid 200 payloads', async ({
        page,
    }) => {
        await installTokenPlaceStub(page, 'malformed');
        await seedTokenPlaceEnabledState(page);

        const { chatPanel, spinner } = await sendMessage(page, 'Trigger malformed response');

        const banner = chatPanel.locator('.chat-error');
        await expect(banner).toHaveAttribute('data-error-type', 'malformed');
        await expect(banner).toContainText(/unexpected response/i);
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
});
