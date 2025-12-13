import { test, expect } from '@playwright/test';

// Verify the process creation form layout on mobile

test('process creation page is usable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/processes/create');
    await page.waitForLoadState('networkidle');

    const form = page.locator('form.process-form');
    await expect(form).toBeVisible();

    const formMetrics = await form.evaluate((el) => {
        const style = getComputedStyle(el);
        return {
            paddingLeft: style.paddingLeft,
            paddingRight: style.paddingRight,
            paddingTop: style.paddingTop,
            paddingBottom: style.paddingBottom,
            paddingLeftValue: parseFloat(style.paddingLeft),
            paddingRightValue: parseFloat(style.paddingRight),
            paddingTopValue: parseFloat(style.paddingTop),
            paddingBottomValue: parseFloat(style.paddingBottom),
            clientWidth: el.clientWidth,
        };
    });

    expect(formMetrics.paddingLeft).toBe('10px');
    expect(formMetrics.paddingRight).toBe('10px');
    expect(formMetrics.paddingTop).toBe('10px');
    expect(formMetrics.paddingBottom).toBe('10px');

    const submitRow = page.locator('.form-submit');
    await expect(submitRow).toBeVisible();

    const submitLayout = await submitRow.evaluate((el) => {
        const style = getComputedStyle(el);
        return {
            flexDirection: style.flexDirection,
            alignItems: style.alignItems,
        };
    });

    expect(submitLayout.flexDirection).toBe('column');
    expect(submitLayout.alignItems).toBe('stretch');

    const primaryButton = page.getByRole('button', { name: /create process/i });
    await expect(primaryButton).toBeVisible();

    const buttonMetrics = await primaryButton.evaluate((el) => ({
        clientWidth: el.clientWidth,
    }));

    const availableWidth =
        formMetrics.clientWidth - formMetrics.paddingLeftValue - formMetrics.paddingRightValue;

    expect(Math.abs(buttonMetrics.clientWidth - availableWidth)).toBeLessThanOrEqual(2);

    await page.screenshot({ path: './test-artifacts/mobile-process-form.png' });
});
