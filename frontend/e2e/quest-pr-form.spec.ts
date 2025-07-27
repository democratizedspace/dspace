import { test, expect } from '@playwright/test';

test('quest PR form is accessible', async ({ page }) => {
    await page.goto('/quests/submit');
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
    await page.goto('/quests/submit');
    await page.fill('#token', 't');
    await page.fill('#quest', '{"title":"t","description":"d"}');
    await page.click('button:has-text("Create Pull Request")');
    await expect(page.getByTestId('pr-link')).toHaveAttribute('href', 'https://example.com/pr/1');
});
