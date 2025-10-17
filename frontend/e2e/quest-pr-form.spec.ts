import { test, expect } from '@playwright/test';
import { waitForHydration } from './test-helpers';

test('quest PR form is accessible', async ({ page }) => {
    await page.goto('/quests/submit', { waitUntil: 'domcontentloaded' });
    await waitForHydration(page);
    await expect(page.getByText('GitHub Token')).toBeVisible();
    await expect(page.getByRole('button', { name: /Create Pull Request/i })).toBeVisible();
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
    await page.goto('/quests/submit', { waitUntil: 'domcontentloaded' });
    await waitForHydration(page);
    const validToken = `ghp_${'a'.repeat(36)}`;
    await page.fill('#token', validToken);
    await page.fill('#quest', '{"title":"t","description":"d"}');
    await page.click('button:has-text("Create Pull Request")');
    await waitForHydration(page);
    await expect(page.getByTestId('pr-link')).toHaveAttribute('href', 'https://example.com/pr/1');
    await expect(page.locator('#token')).toHaveValue(validToken);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitForHydration(page);
    await expect(page.locator('#token')).toHaveValue(validToken);
    await page.click('[data-testid="clear-token"]');
    await expect(page.locator('#token')).toHaveValue('');
    const cleared = await page.evaluate(() => {
        const state = JSON.parse(localStorage.getItem('gameState') || '{}');
        return state.github?.token || '';
    });
    expect(cleared).toBe('');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitForHydration(page);
    await expect(page.locator('#token')).toHaveValue('');
});
