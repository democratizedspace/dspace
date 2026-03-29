import { test, expect } from '@playwright/test';

// Verify the process creation form layout on mobile
const MOBILE_VIEWPORT = { width: 375, height: 667 };

test('process creation page is usable on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
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

    const overflowDiagnostics = await page.evaluate(() => {
        const form = document.querySelector('form.process-form');
        const controls = Array.from(
            document.querySelectorAll(
                'form.process-form input[type="text"], form.process-form input[type="number"], form.process-form textarea'
            )
        );
        const docEl = document.documentElement;
        const formRect = form?.getBoundingClientRect();
        const maxControlRight = controls.reduce((max, control) => {
            const rect = control.getBoundingClientRect();
            return Math.max(max, rect.right);
        }, 0);

        return {
            docScrollWidth: docEl.scrollWidth,
            docClientWidth: docEl.clientWidth,
            bodyScrollWidth: document.body.scrollWidth,
            formRight: formRect?.right ?? 0,
            maxControlRight,
            controlCount: controls.length,
        };
    });

    expect(overflowDiagnostics.controlCount).toBeGreaterThan(0);
    expect(overflowDiagnostics.docScrollWidth).toBeLessThanOrEqual(
        overflowDiagnostics.docClientWidth + 1
    );
    expect(overflowDiagnostics.bodyScrollWidth).toBeLessThanOrEqual(
        overflowDiagnostics.docClientWidth + 1
    );
    expect(overflowDiagnostics.maxControlRight).toBeLessThanOrEqual(
        overflowDiagnostics.formRight + 1
    );

    await page.screenshot({ path: './test-artifacts/mobile-process-form.png' });
});
