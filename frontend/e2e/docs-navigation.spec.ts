import { test, expect } from '@playwright/test';
import { clearUserData } from './test-helpers';

test.describe('Docs Navigation', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('docs pages should load and display headings', async ({ page }) => {
        await page.goto('/docs');
        await expect(page.getByRole('heading', { name: /Docs/i })).toBeVisible();

        const pages = [
            { href: '/docs/about', title: /About/i },
            { href: '/docs/mission', title: /Mission/i },
            { href: '/docs/faq', title: /FAQ|Freqently/i },
            { href: '/docs/3dprinting', title: /3D Printing/i },
        ];

        for (const p of pages) {
            await page.click(`a[href="${p.href}"]`);
            await page.waitForLoadState('networkidle');
            await expect(page.getByRole('heading', { name: p.title })).toBeVisible();
        }
    });
});
