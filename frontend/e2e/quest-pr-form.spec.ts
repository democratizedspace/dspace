import { test, expect } from '@playwright/test';
import { waitForHydration } from './test-helpers';

test('quest PR form is accessible', async ({ page }) => {
    await page.goto('/quests/submit');
    await waitForHydration(page);
    await expect(page.getByLabel('GitHub Token*')).toBeVisible();
    await expect(page.getByRole('button', { name: /^Create Pull Request$/ })).toBeVisible();
});

test('quest PR form submits and shows link', async ({ page }) => {
    await page.route('https://api.github.com/**', async (route) => {
        if (route.request().url().endsWith('/pulls')) {
            await route.fulfill({
                status: 201,
                contentType: 'application/json',
                body: JSON.stringify({ html_url: 'https://example.com/pr/1' }),
            });
        } else {
            await route.fulfill({ status: 201, body: '{}' });
        }
    });
    await page.goto('/quests/submit');
    await waitForHydration(page);
    const validToken = `ghp_${'a'.repeat(36)}`;
    const tokenField = page.getByLabel('GitHub Token*');
    await tokenField.fill(validToken);
    const questField = page.getByLabel('Quest JSON*');
    await questField.fill('{"title":"t","description":"d"}');
    await page.getByRole('button', { name: /^Create Pull Request$/ }).click();
    await expect(page.getByTestId('pr-link')).toHaveAttribute('href', 'https://example.com/pr/1');
    await expect(tokenField).toHaveValue(validToken);
    await page.reload();
    await waitForHydration(page);
    await expect(tokenField).toHaveValue(validToken);
    await page.click('[data-testid="clear-token"]');
    await expect(tokenField).toHaveValue('');
    const cleared = await page.evaluate(() => {
        const state = JSON.parse(localStorage.getItem('gameState') || '{}');
        return state.github?.token || '';
    });
    expect(cleared).toBe('');
    await page.reload();
    await waitForHydration(page);
    await expect(tokenField).toHaveValue('');
});
