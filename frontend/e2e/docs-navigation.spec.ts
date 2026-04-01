import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

test.describe('Docs Navigation', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('docs pages should load and display headings', async ({ page }) => {
        const pages = [
            { href: '/docs', heading: /Docs/i },
            { href: '/docs/about', heading: /About/i },
            { href: '/docs/mission', heading: /Mission/i },
            { href: '/docs/faq', heading: /FAQ|Frequently/i },
            { href: '/docs/3dprinting', heading: /3D Printing/i },
        ];

        for (const p of pages) {
            await page.goto(p.href);
            await page.waitForLoadState('networkidle');
            await waitForHydration(page);
            await expect(page.getByRole('heading', { name: p.heading }).first()).toBeVisible();
        }
    });
});
