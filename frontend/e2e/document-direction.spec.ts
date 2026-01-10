import { expect, test } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

test.describe('Document direction', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('uses LTR direction for the root document', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const { documentDirection, bodyDirection, documentDirAttr, bodyDirAttr } =
            await page.evaluate(() => {
                const rootStyle = getComputedStyle(document.documentElement);
                const bodyStyle = getComputedStyle(document.body);
                return {
                    documentDirection: rootStyle.direction,
                    bodyDirection: bodyStyle.direction,
                    documentDirAttr: document.documentElement.getAttribute('dir'),
                    bodyDirAttr: document.body.getAttribute('dir'),
                };
            });

        expect(documentDirection).toBe('ltr');
        expect(bodyDirection).toBe('ltr');
        expect(documentDirAttr).not.toBe('rtl');
        expect(bodyDirAttr).not.toBe('rtl');
    });
});
