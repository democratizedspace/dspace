import { expect, test } from '@playwright/test';
import { waitForHydration } from './test-helpers';

test('quest creation form adapts to mobile layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/quests/create');
    await page.waitForLoadState('networkidle');
    await waitForHydration(page);

    const form = page.locator('form.quest-form');
    await expect(form).toBeVisible();

    const paddingLeft = await form.evaluate((el) => getComputedStyle(el).paddingLeft);
    expect(paddingLeft).toBe('10px');

    const layout = await page.evaluate(() => {
        const scrollingElement = document.scrollingElement || document.documentElement;
        const form = document.querySelector('form.quest-form');
        const submitButton = form?.querySelector('button[type="submit"]');
        const previewButton = form?.querySelector('.preview-button');
        const formRect = form?.getBoundingClientRect();
        const submitRect = submitButton?.getBoundingClientRect();
        const previewRect = previewButton?.getBoundingClientRect();
        const styles = form ? getComputedStyle(form) : null;

        return {
            hasHorizontalOverflow: Boolean(
                scrollingElement && scrollingElement.scrollWidth > scrollingElement.clientWidth
            ),
            formWidth: formRect?.width ?? 0,
            submitWidth: submitRect?.width ?? 0,
            previewWidth: previewRect?.width ?? 0,
            submitTop: submitRect?.top ?? 0,
            previewTop: previewRect?.top ?? 0,
            paddingLeft: styles ? parseFloat(styles.paddingLeft) : 0,
            paddingRight: styles ? parseFloat(styles.paddingRight) : 0,
            borderLeft: styles ? parseFloat(styles.borderLeftWidth) : 0,
            borderRight: styles ? parseFloat(styles.borderRightWidth) : 0,
        };
    });

    expect(layout.hasHorizontalOverflow).toBe(false);
    expect(layout.submitTop).toBeLessThan(layout.previewTop);
    const contentWidth =
        layout.formWidth -
        layout.paddingLeft -
        layout.paddingRight -
        layout.borderLeft -
        layout.borderRight;
    expect(layout.submitWidth).toBeGreaterThanOrEqual(contentWidth - 2);
    expect(layout.previewWidth).toBeGreaterThanOrEqual(contentWidth - 2);

    await page.screenshot({ path: './test-artifacts/mobile-quest-form.png', fullPage: true });
});
