import { expect, test } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

test.describe('Document direction', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('uses LTR direction at the document root', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const { htmlDirection, bodyDirection, dirAttribute } = await page.evaluate(() => {
            return {
                htmlDirection: getComputedStyle(document.documentElement).direction,
                bodyDirection: getComputedStyle(document.body).direction,
                dirAttribute: document.documentElement.getAttribute('dir'),
            };
        });

        expect(htmlDirection).toBe('ltr');
        expect(bodyDirection).toBe('ltr');
        expect(dirAttribute).not.toBe('rtl');
    });
});
