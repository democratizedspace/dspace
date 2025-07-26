import { test, expect } from '@playwright/test';

test('quest PR form is accessible', async ({ page }) => {
    await page.goto('/quests/submit');
    await expect(page.getByText('GitHub Token')).toBeVisible();
    await expect(page.getByRole('button', { name: /Create Pull Request/i })).toBeVisible();
});
