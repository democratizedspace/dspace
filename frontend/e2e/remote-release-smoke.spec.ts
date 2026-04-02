import { fileURLToPath } from 'url';
import { expect, test, type Page } from '@playwright/test';
import path from 'path';
import { waitForHydration } from './test-helpers';

const TOP_NAV_ROUTES = [
    '/',
    '/quests',
    '/inventory',
    '/energy',
    '/wallet',
    '/profile',
    '/docs',
    '/chat',
    '/changelog',
];

const MORE_MENU_ROUTES = [
    '/settings',
    '/cloudsync',
    '/stats',
    '/leaderboard',
    '/gamesaves',
    '/contentbackup',
    '/achievements',
    '/titles',
    '/shop',
];

const TOOLBOX_AND_EDITORS = [
    '/toolbox',
    '/inventory/manage',
    '/processes/manage',
    '/quests/manage',
    '/inventory/create',
    '/processes/create',
    '/quests/create',
];

const SHOULD_MUTATE = process.env.REMOTE_SMOKE_MUTATION === '1';
const CHAT_MODE = process.env.REMOTE_SMOKE_CHAT_MODE === 'live' ? 'live' : 'ui';
const CHAT_LIVE_BACKEND = process.env.REMOTE_SMOKE_CHAT_LIVE_BACKEND === 'real' ? 'real' : 'mock';
const CHAT_API_KEY = process.env.REMOTE_SMOKE_CHAT_API_KEY || ''; // scan-secrets: ignore
const CHAT_PROMPT =
    process.env.REMOTE_SMOKE_CHAT_PROMPT || 'Remote smoke check: respond with one short sentence.';
const MOCK_LIVE_CHAT_REPLY = 'Remote smoke mock assistant reply.';
const TEST_ITEM_IMAGE_PATH = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../test-data/test-image.jpg'
);

async function configureLiveChatTransport(page: Page): Promise<void> {
    if (CHAT_LIVE_BACKEND !== 'real') {
        await page.addInitScript(
            ({ reply }) => {
                // @ts-expect-error test hook for OpenAI client
                window.__DSpaceOpenAIClient = function () {
                    return {
                        responses: {
                            create: async () => ({ output_text: reply }),
                        },
                    };
                };
            },
            { reply: MOCK_LIVE_CHAT_REPLY }
        );
        return;
    }

    if (!CHAT_API_KEY) {
        throw new Error(
            'REMOTE_SMOKE_CHAT_LIVE_BACKEND=real requires REMOTE_SMOKE_CHAT_API_KEY to be set.'
        );
    }

    await page.route('https://api.openai.com/v1/responses*', async (route, request) => {
        const headers = {
            ...request.headers(),
            authorization: `Bearer ${CHAT_API_KEY}`,
        };
        await route.continue({ headers });
    });
}

async function visitRouteAndAssert(page: Page, route: string): Promise<void> {
    const response = await page.goto(route);
    expect(response?.status(), `Route ${route} returned unexpected status`).toBeLessThan(400);

    try {
        await page.waitForLoadState('networkidle', { timeout: 10_000 });
    } catch {
        await page.waitForLoadState('load');
    }

    await waitForHydration(page);

    const heading = page.locator('main h1, main h2, main [role="heading"]');
    await expect(heading.first(), `Route ${route} should expose a visible heading`).toBeVisible();
    const text = (await heading.first().textContent()) ?? '';
    expect(text.trim().length, `Route ${route} heading should not be empty`).toBeGreaterThan(0);
}

async function openFirstQuest(page: Page): Promise<void> {
    await page.goto('/quests');
    await waitForHydration(page);

    const firstQuest = page
        .locator(
            [
                'a[href^="/quests/"]',
                ':not([href="/quests"])',
                ':not([href="/quests/create"])',
                ':not([href*="/quests/manage"])',
            ].join('')
        )
        .first();

    await expect(firstQuest, 'Expected at least one quest entry on /quests').toBeVisible();
    await firstQuest.click();
    await page.waitForLoadState('domcontentloaded');
    await waitForHydration(page);

    const optionButtons = page.locator(
        [
            '.options button',
            'main nav button:has(.chip-text)',
            'main button:has-text("Continue")',
            'main button:has-text("Start")',
            'main button:has-text("Finish")',
            'main button:has-text("Next")',
        ].join(', ')
    );
    const firstVisibleOption = optionButtons.filter({ visible: true }).first();
    await expect(
        firstVisibleOption,
        'Expected at least one quest interaction button'
    ).toBeVisible();
    await firstVisibleOption.click();
    await expect(page).toHaveURL(/\/quests\//);
}

async function runProcessLifecycle(page: Page): Promise<void> {
    await page.goto('/processes');
    await waitForHydration(page);

    const processRow = page
        .locator('tr, .process-row, [data-testid="process-row"], li, article, section, div')
        .filter({ has: page.locator('button').filter({ hasText: /start/i }) })
        .first();
    const startButton = processRow.locator('button').filter({ hasText: /start/i }).first();

    await expect(startButton, 'Expected at least one process start button').toBeVisible();
    await startButton.click();

    const cancelButton = processRow
        .locator('button')
        .filter({ hasText: /cancel/i })
        .first();

    const collectButton = processRow
        .locator('button')
        .filter({ hasText: /collect/i })
        .first();

    if (await cancelButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await cancelButton.click();
        await expect(startButton).toBeVisible();
        return;
    }

    if (await collectButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await collectButton.click();
        await expect(startButton).toBeVisible();
        return;
    }

    const activeMarker = processRow.locator(
        '[data-status="active"], .process-running, :text("In progress")'
    );
    const state = await Promise.race([
        cancelButton.waitFor({ state: 'visible', timeout: 12_000 }).then(() => 'cancel' as const),
        collectButton.waitFor({ state: 'visible', timeout: 12_000 }).then(() => 'collect' as const),
        activeMarker
            .first()
            .waitFor({ state: 'visible', timeout: 12_000 })
            .then(() => 'active' as const),
    ]).catch(() => 'none' as const);

    if (state === 'cancel') {
        await cancelButton.click();
        await expect(startButton).toBeVisible();
        return;
    }

    if (state === 'collect') {
        await collectButton.click();
        await expect(startButton).toBeVisible();
        return;
    }

    if (state === 'active') {
        await expect(
            activeMarker.first(),
            'Expected process to enter an active state'
        ).toBeVisible();
        return;
    }

    const resetToStart = await startButton.isVisible({ timeout: 2_000 }).catch(() => false);
    expect(
        resetToStart,
        'Process did not expose cancel/collect/active indicators or return to a startable state'
    ).toBeTruthy();
}

async function createAndDeleteCustomItem(page: Page): Promise<void> {
    const uniqueName = `Remote Smoke Item ${Date.now()}`;

    await page.goto('/inventory/create');
    await waitForHydration(page);

    await page.locator('#name').fill(uniqueName);
    await page
        .locator('#description')
        .fill('Temporary smoke-test item for remote harness verification.');
    await page.locator('#price-amount').fill('1');
    await page.locator('#price-currency').selectOption('dUSD');
    await page.locator('#unit').fill('unit');
    await page.locator('#type').fill('resource');
    await page.locator('#image').setInputFiles(TEST_ITEM_IMAGE_PATH);

    const createButton = page.getByRole('button', { name: /create item/i });
    const manageItemsLink = page.getByRole('link', { name: /manage items/i }).first();
    const manageItemsVisibleBeforeSubmit = await manageItemsLink
        .isVisible()
        .catch(() => false);
    await createButton.click();

    try {
        await page.waitForLoadState('networkidle', { timeout: 10_000 });
    } catch {
        await page.waitForLoadState('load');
    }

    await Promise.any([
        page.waitForURL((url) => !url.pathname.endsWith('/inventory/create'), {
            timeout: 15_000,
        }),
        page
            .getByRole('status')
            .filter({ hasText: /item created successfully/i })
            .first()
            .waitFor({ state: 'visible', timeout: 15_000 }),
        (async () => {
            if (manageItemsVisibleBeforeSubmit) {
                throw new Error(
                    'Manage items link was already visible before submit; cannot use as post-submit signal.'
                );
            }
            await manageItemsLink.waitFor({ state: 'visible', timeout: 15_000 });
        })(),
    ]);

    await page.goto('/inventory/manage');
    await waitForHydration(page);

    const itemHeading = page.getByRole('heading', { level: 4, name: uniqueName }).first();
    await expect(itemHeading, 'Expected newly created custom item heading to appear').toBeVisible();
    const row = page.locator('.item-row').filter({ has: itemHeading }).first();
    await expect(row, 'Expected newly created custom item to appear on manage page').toBeVisible();

    const deleteButton = row
        .locator('button')
        .filter({ hasText: /delete/i })
        .first();
    await expect(deleteButton, 'Expected custom item row to include a delete action').toBeVisible();

    const dialogHandled = page
        .waitForEvent('dialog', { timeout: 3_000 })
        .then(async (dialog) => {
            await dialog.accept();
            return true;
        })
        .catch(() => false);

    await deleteButton.click();

    if (!(await dialogHandled)) {
        const confirmDelete = page
            .getByRole('button', { name: /confirm|delete/i })
            .filter({ hasNotText: /cancel/i })
            .first();

        if (await confirmDelete.isVisible({ timeout: 2_000 }).catch(() => false)) {
            await confirmDelete.click();
        }
    }

    await expect(row).toHaveCount(0);
}

async function verifyChat(page: Page): Promise<void> {
    if (CHAT_MODE === 'live') {
        await configureLiveChatTransport(page);
    }

    await page.goto('/chat');
    await waitForHydration(page);

    const panel = page.locator('[data-testid="chat-panel"]').first();
    await expect(panel).toBeVisible();
    await expect(panel).toHaveAttribute('data-hydrated', 'true');

    const textbox = panel.getByRole('textbox');
    await expect(textbox).toBeEnabled();

    const sendButton = panel.getByRole('button', { name: /send/i });
    await expect(sendButton).toBeEnabled();

    if (CHAT_MODE !== 'live') {
        return;
    }

    const userMessages = panel.locator('.message-bubble.user, [data-role="user"]');
    const assistantReplies = panel.locator('.message-bubble.assistant, [data-role="assistant"]');
    const errorBanner = panel.locator('.chat-error, [data-error-type]');
    const chatSpinner = panel.locator('.spinner-container');

    await expect(
        chatSpinner,
        'Expected chat panel to finish loading before sending'
    ).not.toBeVisible({
        timeout: 15_000,
    });

    const startingUserMessageCount = await userMessages.count();
    const startingAssistantReplyCount = await assistantReplies.count();

    await textbox.fill(CHAT_PROMPT);
    await sendButton.click();

    await expect(userMessages, 'Expected sending to append a new user message bubble').toHaveCount(
        startingUserMessageCount + 1,
        { timeout: 10_000 }
    );
    await expect(textbox, 'Expected textbox to clear after send').toHaveValue('');

    const winner = await Promise.race([
        (async () => {
            await expect(
                assistantReplies,
                'Expected a new assistant reply after sending'
            ).toHaveCount(startingAssistantReplyCount + 1, { timeout: 30_000 });
            await expect(
                assistantReplies.first(),
                'Expected the newest assistant reply to be visible'
            ).toBeVisible();
            return 'assistant' as const;
        })(),
        errorBanner
            .first()
            .waitFor({ state: 'visible', timeout: 30_000 })
            .then(() => 'error' as const),
    ]);

    expect(winner, 'Chat returned an error instead of an assistant reply').toBe('assistant');
    await expect(errorBanner.first(), 'Expected no chat error banner').not.toBeVisible();
    await expect(
        assistantReplies.first(),
        'Expected the new assistant reply to be visible'
    ).toBeVisible();
    if (CHAT_LIVE_BACKEND === 'mock') {
        await expect(
            assistantReplies.first(),
            'Expected mock live-chat path to return the known smoke reply'
        ).toContainText(MOCK_LIVE_CHAT_REPLY);
    }
}

test.describe('Remote release smoke', () => {
    test.describe.configure({ mode: 'serial' });
    test.setTimeout(180_000);

    test('covers app shell + route smoke', async ({ page }) => {
        const consoleErrors: Array<{ route: string; message: string }> = [];
        let activeRoute = '';

        page.on('console', (msg) => {
            if (msg.type() !== 'error') {
                return;
            }

            const message = msg.text();
            if (message.includes('Failed to load resource') && message.includes('status of 404')) {
                return;
            }

            consoleErrors.push({ route: activeRoute || page.url(), message });
        });

        page.on('pageerror', (error) => {
            consoleErrors.push({ route: activeRoute || page.url(), message: error.message });
        });

        const routes = [...TOP_NAV_ROUTES, ...MORE_MENU_ROUTES, ...TOOLBOX_AND_EDITORS];
        for (const route of routes) {
            activeRoute = route;
            await visitRouteAndAssert(page, route);
        }

        expect(consoleErrors).toEqual([]);
    });

    test('runs one quest interaction sanity check', async ({ page }) => {
        await openFirstQuest(page);
    });

    test('runs one process lifecycle sanity check', async ({ page }) => {
        await runProcessLifecycle(page);
    });

    test('creates and deletes one custom item (default, opt-out with --no-mutate)', async ({
        page,
    }) => {
        test.skip(
            !SHOULD_MUTATE,
            'Set REMOTE_SMOKE_MUTATION=1 (or run qa:remote-smoke without --no-mutate/--safe) ' +
                'to enable custom-item create/delete checks.'
        );
        await createAndDeleteCustomItem(page);
    });

    test('verifies chat page UI (with optional live send/receive)', async ({ page }) => {
        await verifyChat(page);
    });
});
