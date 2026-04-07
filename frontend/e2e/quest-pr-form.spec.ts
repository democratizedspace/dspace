import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { purgeClientState, waitForHydration } from './test-helpers';

async function waitForQuestPrFormHydration(page: Page) {
    await waitForHydration(page);
    await page.waitForFunction(() => {
        const form = document.querySelector('.pr-form');
        return form?.getAttribute('data-hydrated') === 'true';
    });
}

test.beforeEach(async ({ page }) => {
    await purgeClientState(page);
});

test('quest PR form is accessible', async ({ page }) => {
    await page.goto('/quests/submit');
    await waitForQuestPrFormHydration(page);
    await expect(page.getByLabel('GitHub Token*')).toBeVisible();
    await expect(page.getByRole('button', { name: /Create Pull Request/i })).toBeVisible();
});

test('shows validation guidance when token or quest JSON are missing', async ({ page }) => {
    await page.goto('/quests/submit');
    await waitForQuestPrFormHydration(page);
    await page.getByLabel('GitHub Token*').fill('   ');
    await page.getByLabel('Quest JSON*').fill('   ');
    await page.getByRole('button', { name: 'Create Pull Request' }).click();
    await expect(page.getByTestId('token-error')).toHaveText('GitHub token looks invalid');
    await expect(page.getByTestId('quest-json-error')).toHaveText('Quest JSON is required');
    await expect(page.getByTestId('submit-error')).toHaveText('Please fix the errors above');
});

test('surfaces GitHub scope errors when the API rejects the token', async ({ page }) => {
    await page.route('https://api.github.com/**', async (route) => {
        await route.fulfill({
            status: 403,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'Bad credentials or missing scopes' }),
        });
    });
    await page.goto('/quests/submit');
    await waitForQuestPrFormHydration(page);
    await page.getByLabel('GitHub Token*').fill(`ghp_${'a'.repeat(36)}`);
    await page.getByLabel('Quest JSON*').fill('{"title":"t","description":"d"}');
    await Promise.all([
        page.waitForRequest('https://api.github.com/**'),
        page.getByRole('button', { name: 'Create Pull Request' }).click(),
    ]);
    await expect(page.getByTestId('submit-error')).toHaveText('Failed to submit quest');
    await expect(page.getByTestId('pr-success')).toHaveCount(0);
});

test('keeps form state when network errors occur', async ({ page }) => {
    await page.route('https://api.github.com/**', async (route) => {
        await route.fulfill({
            status: 503,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'Service unavailable' }),
        });
    });
    await page.goto('/quests/submit');
    await waitForQuestPrFormHydration(page);
    const questInput = page.getByLabel('Quest JSON*');
    await page.getByLabel('GitHub Token*').fill(`ghp_${'a'.repeat(36)}`);
    await questInput.fill('{"title":"t","description":"d"}');
    await Promise.all([
        page.waitForRequest('https://api.github.com/**'),
        page.getByRole('button', { name: 'Create Pull Request' }).click(),
    ]);
    await expect(page.getByTestId('submit-error')).toHaveText('Failed to submit quest');
    await expect(questInput).toHaveValue('{"title":"t","description":"d"}');
});

test('quest PR form submits and shows link', async ({ page }) => {
    await page.route('https://api.github.com/**', async (route) => {
        const request = route.request();

        if (request.method() === 'POST' && request.url().includes('/pulls')) {
            await route.fulfill({
                status: 201,
                contentType: 'application/json',
                body: JSON.stringify({ html_url: 'https://example.com/pr/1' }),
            });
            return;
        }

        await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({ content: { sha: 'abc123' } }),
        });
    });
    await page.goto('/quests/submit');
    await waitForQuestPrFormHydration(page);
    const validToken = `ghp_${'a'.repeat(36)}`;
    await page.getByLabel('GitHub Token*').fill(validToken);
    await page.getByLabel('Quest JSON*').fill('{"title":"t","description":"d"}');
    await page.getByRole('button', { name: 'Create Pull Request' }).click();
    await waitForHydration(page);
    await expect(page.getByTestId('pr-success')).toBeVisible();
    await expect(page.getByTestId('pr-link')).toHaveAttribute('href', 'https://example.com/pr/1');
    await expect(page.getByLabel('GitHub Token*')).toHaveValue(validToken);
    await page.reload();
    await waitForHydration(page);
    await expect(page.getByLabel('GitHub Token*')).toHaveValue(validToken);
    await page.getByTestId('clear-token').click();
    await expect(page.getByLabel('GitHub Token*')).toHaveValue('');
    const cleared = await page.evaluate(() => {
        const state = JSON.parse(localStorage.getItem('gameState') || '{}');
        return state.github?.token || '';
    });
    expect(cleared).toBe('');
    await page.reload();
    await waitForHydration(page);
    await expect(page.getByLabel('GitHub Token*')).toHaveValue('');
});
