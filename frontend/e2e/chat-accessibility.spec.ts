import { expect, test, type Locator, type Page } from '@playwright/test';

import { clearUserData, waitForHydration } from './test-helpers';

async function tabTo(page: Page, target: Locator) {
    await expect(target).toBeEnabled();
    for (let step = 0; step < 100; step += 1) {
        if (await target.evaluate((element) => element === document.activeElement)) return;
        await page.keyboard.press('Tab');
    }
    await expect(target).toBeFocused();
}

async function expectFocusIndicator(target: Locator) {
    await expect(target).toBeFocused();
    expect(
        await target.evaluate((element) => {
            const { outlineColor, outlineStyle, outlineWidth } = getComputedStyle(element);
            return (
                element.matches(':focus-visible') &&
                outlineStyle !== 'none' &&
                parseFloat(outlineWidth) > 0 &&
                outlineColor !== 'transparent' &&
                outlineColor !== 'rgba(0, 0, 0, 0)'
            );
        })
    ).toBe(true);
    await expect(target).toBeInViewport();
}

async function expectReadableAtPhoneWidth(target: Locator) {
    await expect(target).toBeVisible();
    await target.scrollIntoViewIfNeeded();
    const measurements = await target.evaluate((element) => {
        const width = document.documentElement.clientWidth;
        const { left, right } = element.getBoundingClientRect();
        const range = document.createRange();
        range.selectNodeContents(element);
        const rows = [...range.getClientRects()].filter((rect) => rect.width && rect.height);
        return {
            fits: left >= -1 && right <= width + 1,
            textFits:
                rows.length > 0 &&
                rows.every((rect) => rect.left >= left - 1 && rect.right <= right + 1),
            noHorizontalScroll: element.scrollWidth <= element.clientWidth + 1,
        };
    });
    expect(measurements).toEqual({ fits: true, textFits: true, noHorizontalScroll: true });
}

test.describe('Chat accessibility and mobile layout', () => {
    test.beforeEach(async ({ baseURL, context, page }) => {
        if (!baseURL) throw new Error('Expected an isolated local Playwright web server');
        const origin = new URL(baseURL);
        if (!['127.0.0.1', 'localhost', '[::1]'].includes(origin.hostname)) {
            throw new Error('Chat accessibility checks must run against loopback only');
        }
        await context.route('**/*', (route) =>
            new URL(route.request().url()).origin === origin.origin
                ? route.continue()
                : route.abort('blockedbyclient')
        );
        await clearUserData(page);
        await page.addInitScript(() => {
            if (sessionStorage.getItem('dspace-e2e-accessibility-seeded')) return;
            localStorage.setItem(
                'gameState',
                JSON.stringify({ settings: { chatProvider: 'token-place' } })
            );
            sessionStorage.setItem('dspace-e2e-accessibility-seeded', '1');
        });
    });

    test('shows a keyboard focus indicator on Chat and provider settings controls', async ({
        page,
    }) => {
        await page.goto('/chat');
        await waitForHydration(page);
        const panel = page.getByTestId('chat-panel');
        await expect(panel).toHaveAttribute('data-hydrated', 'true');
        const persona = panel.getByRole('combobox', { name: 'Talk to' });
        await tabTo(page, persona);
        await expectFocusIndicator(persona);
        const composer = panel.getByRole('textbox', { name: 'Chat message' });
        await tabTo(page, composer);
        await page.keyboard.type('A local keyboard check');
        const send = panel.getByRole('button', { name: 'Send', exact: true });
        await tabTo(page, send);
        await expectFocusIndicator(send);

        await page.goto('/settings');
        const settings = page.getByTestId('chat-provider-settings');
        await expect(settings).toHaveAttribute('data-hydrated', 'true');
        const relay = settings.getByRole('radio', { name: /token\.place/ });
        await expect(relay).toBeChecked();
        await tabTo(page, relay);
        await expectFocusIndicator(relay);
        await page.keyboard.press('ArrowDown');
        const openAI = settings.getByRole('radio', { name: /OpenAI/ });
        await expect(openAI).toBeChecked();
        await expectFocusIndicator(openAI);
        const key = settings.getByLabel('OpenAI API key', { exact: true });
        await tabTo(page, key);
        await expectFocusIndicator(key);
    });

    for (const width of [360, 390]) {
        test.describe(`Phone width ${width}px`, () => {
            test.use({ viewport: { width, height: 800 }, hasTouch: true });

            test('keeps relay errors and provider guidance in view', async ({ page }) => {
                let relayRequests = 0;
                await page.route(
                    /^https?:\/\/(?:staging\.)?token\.place\/api\/v1\/relay\/servers\/next(?:\?|$)/,
                    (route) => {
                        relayRequests += 1;
                        return route.abort('failed');
                    }
                );
                await page.goto('/chat');
                await waitForHydration(page);
                const panel = page.getByTestId('chat-panel');
                await expect(panel).toHaveAttribute('data-hydrated', 'true');
                await expect(panel).toHaveAttribute('data-provider', 'token-place');
                await panel
                    .getByRole('textbox', { name: 'Chat message' })
                    .fill('Local layout check');
                await panel.getByRole('button', { name: 'Send', exact: true }).click();
                const error = panel.getByRole('alert');
                await expect(error).toHaveAttribute('data-error-type', 'network');
                await expect(error).toContainText(/could not reach token\.place/i);
                expect(relayRequests).toBeGreaterThan(0);
                await expectReadableAtPhoneWidth(error);

                await page.goto('/settings');
                const settings = page.getByTestId('chat-provider-settings');
                await expect(settings).toHaveAttribute('data-hydrated', 'true');
                await expectReadableAtPhoneWidth(
                    settings.getByText('No API key required.', { exact: false })
                );
                await expectReadableAtPhoneWidth(settings.getByTestId('token-place-no-key-note'));
                await expectReadableAtPhoneWidth(
                    settings.getByText(/your own OpenAI API key stored locally/i)
                );
                await settings.getByRole('radio', { name: /OpenAI/ }).click();
                await expect(settings.getByRole('status')).toHaveText(
                    'Chat provider saved: OpenAI.'
                );
                await page.goto('/chat');
                await waitForHydration(page);
                await expect(panel).toHaveAttribute('data-hydrated', 'true');
                await expect(panel).toHaveAttribute('data-provider', 'openai');
                await panel
                    .getByRole('textbox', { name: 'Chat message' })
                    .fill('Local key guidance check');
                await panel.getByRole('button', { name: 'Send', exact: true }).click();
                await expect(error).toHaveAttribute('data-error-type', 'missing-key');
                await expect(error).toContainText(/OpenAI requires an API key/i);
                await expectReadableAtPhoneWidth(error);
                await expect(error.getByRole('link', { name: 'Open Settings' })).toHaveAttribute(
                    'href',
                    '/settings'
                );
            });
        });
    }
});
