import { expect, test, type Page } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

const CHAT_MODE = (process.env.REMOTE_SMOKE_CHAT_MODE ?? 'ui').toLowerCase();
const ENABLE_MUTATIONS = process.env.REMOTE_SMOKE_ENABLE_MUTATIONS === '1';

const CORE_ROUTES = [
    '/',
    '/quests',
    '/inventory',
    '/energy',
    '/wallet',
    '/profile',
    '/docs',
    '/chat',
    '/toolbox',
    '/inventory/manage',
    '/processes/manage',
    '/quests/manage',
    '/inventory/create',
    '/processes/create',
    '/quests/create',
];

function uniqueName(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

async function visitRoute(page: Page, route: string): Promise<void> {
    const response = await page.goto(route);
    expect(response?.status(), `Route ${route} should not return an HTTP error`).toBeLessThan(400);
    await waitForHydration(page);
    await expect(page.getByRole('main')).toBeVisible();
}

test.describe('Remote release smoke harness', () => {
    test.setTimeout(180_000);

    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('loads app shell, key routes, toolbox, and editor/manage pages', async ({ page }) => {
        for (const route of CORE_ROUTES) {
            await visitRoute(page, route);
        }
    });

    test('runs one simple quest interaction sanity check', async ({ page }) => {
        await visitRoute(page, '/quests');

        const questLink = page
            .locator('a[href^="/quests/"]')
            .filter({ hasNotText: 'Create Quest' })
            .first();
        await expect(questLink).toBeVisible();

        const href = await questLink.getAttribute('href');
        expect(href, 'Expected a quest detail link from the quests page').toBeTruthy();

        await page.goto(href ?? '/quests');
        await waitForHydration(page);

        const optionButton = page
            .getByRole('button')
            .filter({ hasText: /continue|start|next|accept|finish|complete/i })
            .first();

        if ((await optionButton.count()) > 0) {
            await optionButton.click();
        }

        await expect(page.getByRole('main')).toBeVisible();
    });

    test('loads chat page and supports optional live send/receive mode', async ({ page }) => {
        await visitRoute(page, '/chat');

        const chatPanel = page.locator('[data-testid="chat-panel"]');
        await expect(chatPanel).toBeVisible();

        const messageBox = chatPanel.getByRole('textbox');
        await expect(messageBox).toBeVisible();
        await expect(messageBox).toBeEnabled();

        if (CHAT_MODE !== 'live') {
            test.info().annotations.push({
                type: 'info',
                description: 'REMOTE_SMOKE_CHAT_MODE is not live; validated chat UI only.',
            });
            return;
        }

        const message = `remote smoke ping ${new Date().toISOString()}`;
        await messageBox.fill(message);
        await chatPanel.getByRole('button', { name: /send/i }).click();
        await expect(chatPanel.getByText(message)).toBeVisible();

        const assistantReply = chatPanel.locator('.message-bubble.assistant').last();
        const errorBanner = chatPanel.locator('.chat-error').last();

        const replyOrError = await Promise.race([
            assistantReply
                .waitFor({ state: 'visible', timeout: 25_000 })
                .then(() => 'reply')
                .catch(() => null),
            errorBanner
                .waitFor({ state: 'visible', timeout: 25_000 })
                .then(() => 'error')
                .catch(() => null),
        ]);

        expect(
            replyOrError,
            'Expected a reply or an explicit chat error state in live mode'
        ).toBeTruthy();
    });

    test('optionally runs mutating process + custom item sanity checks', async ({ page }) => {
        test.skip(!ENABLE_MUTATIONS, 'Set REMOTE_SMOKE_ENABLE_MUTATIONS=1 to run mutating checks.');

        const itemName = uniqueName('Remote Smoke Item');

        await visitRoute(page, '/inventory/create');
        await page.getByLabel(/name\*/i).fill(itemName);
        await page.getByLabel(/description\*/i).fill('Temporary smoke-test item; safe to delete.');
        await page.getByLabel(/unit\*/i).fill('unit');
        await page.getByLabel(/type\*/i).fill('resource');
        await page.getByRole('button', { name: /create item/i }).click();

        await expect(page.getByRole('status')).toContainText(/item created successfully/i, {
            timeout: 15_000,
        });

        await visitRoute(page, '/processes');

        const startButton = page.getByRole('button', { name: /^start$/i }).first();
        if ((await startButton.count()) > 0) {
            await startButton.click();
            const cancelButton = page.getByRole('button', { name: /cancel/i }).first();
            if ((await cancelButton.count()) > 0) {
                await cancelButton.click();
            }
        } else {
            test.info().annotations.push({
                type: 'warning',
                description: 'No process start button found; process lifecycle check was limited.',
            });
        }

        await visitRoute(page, '/inventory/manage');
        const row = page.locator('tr, article, li').filter({ hasText: itemName }).first();
        await expect(row).toBeVisible();

        const deleteButton = row.getByRole('button', { name: /delete/i }).first();
        if ((await deleteButton.count()) > 0) {
            await deleteButton.click();
            const confirmButton = page
                .getByRole('button', { name: /confirm|yes, delete|delete item/i })
                .first();
            if ((await confirmButton.count()) > 0) {
                await confirmButton.click();
            }
            await expect(row).toHaveCount(0);
        } else {
            test.info().annotations.push({
                type: 'warning',
                description: 'Delete button unavailable for created item; cleanup may be manual.',
            });
        }
    });
});
