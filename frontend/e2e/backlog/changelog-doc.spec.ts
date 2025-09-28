import { expect, test } from '@playwright/test';

test.describe('docs changelog placeholder', () => {
    test('encourages contributors to add the missing doc', async ({ page }) => {
        await page.goto('/docs/changelog');
        await page.waitForLoadState('domcontentloaded');

        await expect(page.getByRole('heading', { name: 'Doc not found' })).toBeVisible();

        const placeholderBody = page.getByText(
            'Should something exist here? Add a file on Github and submit a pull request.',
            { exact: true }
        );
        const placeholderCta = placeholderBody.locator('xpath=ancestor::a[1]');
        await expect(placeholderCta).toBeVisible();
        await expect(placeholderCta).toHaveAttribute(
            'href',
            'https://github.com/democratizedspace/dspace/new/main/frontend/src/pages/docs/md/changelog.md'
        );

        await expect(
            page.getByText(
                'Should something exist here? Add a file on Github and submit a pull request.',
                { exact: true }
            )
        ).toBeVisible();
    });
});
