import { expect, test, type Page } from '@playwright/test';
import { clearUserData, fillProcessForm, waitForHydration } from './test-helpers';

const TOP_NAV_ROUTES = ['/', '/quests', '/inventory', '/energy', '/wallet', '/profile', '/docs'];
const KEY_ROUTES = ['/chat', '/changelog', '/processes'];
const TOOLBOX_AND_EDITORS = [
    '/toolbox',
    '/inventory/manage',
    '/processes/manage',
    '/quests/manage',
    '/inventory/create',
    '/processes/create',
    '/quests/create',
];

const CHAT_MODE = process.env.REMOTE_SMOKE_CHAT_MODE === 'live' ? 'live' : 'ui';
const CHAT_PROMPT =
    process.env.REMOTE_SMOKE_CHAT_PROMPT ||
    'Remote smoke ping from automated release harness. Reply with a short acknowledgement.';

const expectRouteToLoad = async (page: Page, route: string) => {
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(response?.status(), `Route ${route} should respond < 400`).toBeLessThan(400);
    await waitForHydration(page);
    await expect(page.getByRole('main')).toBeVisible();

    const heading = page.locator('main h1, main h2, main [role="heading"]');
    await expect(heading.first(), `Route ${route} should render a heading`).toBeVisible();
};

test.describe('Remote release smoke harness', () => {
    test.setTimeout(180_000);

    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('app shell, top-nav routes, and key routes load', async ({ page }) => {
        for (const route of [...TOP_NAV_ROUTES, ...KEY_ROUTES]) {
            await expectRouteToLoad(page, route);
        }
    });

    test('toolbox, editor, and manage routes load', async ({ page }) => {
        for (const route of TOOLBOX_AND_EDITORS) {
            await expectRouteToLoad(page, route);
        }
    });

    test('simple quest interaction works without navigation breakage', async ({ page }) => {
        const route = '/quests/welcome/howtodoquests';
        const response = await page.goto(route);
        expect(response?.status()).toBeLessThan(400);
        await waitForHydration(page);

        const questPanel = page.locator('[data-testid="chat-panel"]');
        await expect(questPanel).toBeVisible();

        const initialUrl = page.url();
        const firstOption = page.locator('.options a, .options button').first();
        await expect(firstOption).toBeVisible();
        await firstOption.click();

        await expect
            .poll(async () => await page.locator('.message-bubble, .chat-bubble').count())
            .toBeGreaterThan(0);
        await expect(page).toHaveURL(initialUrl);
    });

    test('process lifecycle sanity via custom process start + cancel', async ({ page }) => {
        const processName = `Remote Smoke Process ${Date.now()}`;

        await page.goto('/inventory/create');
        await waitForHydration(page);
        await page.fill('#name', `Remote Smoke Item ${Date.now()}`);
        await page.fill(
            '#description',
            'Item created for remote smoke process lifecycle sanity check.'
        );
        await page.locator('button.submit-button').click();
        await expect(page.getByRole('status')).toContainText(
            /item (created|updated) successfully/i
        );

        await page.goto('/processes/create');
        await waitForHydration(page, '.process-form');

        const filled = await fillProcessForm(page, processName, '5s', 0, 0, 0);
        expect(filled).toBe(true);

        await page.locator('button.submit-button').click();
        await expect(page.locator('.success-message, [role="status"]')).toContainText(
            /process created successfully/i
        );

        await page.goto('/processes');
        await waitForHydration(page);

        const processCard = page.locator('.process-card, [data-testid="process-row"]').filter({
            hasText: processName,
        });
        await expect(processCard.first()).toBeVisible();

        const startButton = processCard.getByRole('button', { name: /start/i }).first();
        await expect(startButton).toBeVisible();
        await startButton.click();

        const stopOrCancelButton = processCard
            .getByRole('button', { name: /cancel|stop/i })
            .first();
        await expect(stopOrCancelButton).toBeVisible();
    });

    test('custom item create and delete sanity check', async ({ page }) => {
        const itemName = `Remote Smoke Item CRUD ${Date.now()}`;

        await page.goto('/inventory/create');
        await waitForHydration(page);

        await page.fill('#name', itemName);
        await page.fill('#description', 'Temporary item for remote smoke create/delete sanity.');
        await page.locator('button.submit-button').click();
        await expect(page.getByRole('status')).toContainText(
            /item (created|updated) successfully/i
        );

        page.once('dialog', (dialog) => dialog.accept());
        await page.goto('/inventory/manage');
        await waitForHydration(page);

        const targetRow = page.locator('.item-row').filter({ hasText: itemName }).first();
        await expect(targetRow).toBeVisible();

        await targetRow.getByRole('button', { name: /delete/i }).click();
        await expect(targetRow).toHaveCount(0);
    });

    test('chat page loads and supports configurable live send/receive mode', async ({ page }) => {
        await page.goto('/chat');
        await waitForHydration(page);

        const panel = page.locator('[data-testid="chat-panel"][data-provider="openai"]');
        await expect(panel).toHaveAttribute('data-hydrated', 'true');
        const textbox = panel.getByRole('textbox');
        await expect(textbox).toBeEnabled();

        test.skip(
            CHAT_MODE !== 'live',
            'REMOTE_SMOKE_CHAT_MODE=ui validates chat UI only. Use live mode for real send/receive.'
        );

        await textbox.fill(CHAT_PROMPT);
        await panel.getByRole('button', { name: /^send$/i }).click();
        await expect(panel.getByText(CHAT_PROMPT)).toBeVisible();

        const assistantBubble = panel
            .locator('.message-bubble.assistant, .assistant-message')
            .last();
        await expect(assistantBubble).toBeVisible({ timeout: 45_000 });
        await expect(assistantBubble).not.toContainText(CHAT_PROMPT);
    });
});
