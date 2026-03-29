import { expect, test } from '@playwright/test';

const MOBILE_VIEWPORT = { width: 375, height: 812 };
const CREATE_ROUTES = ['/processes/create', '/inventory/create', '/quests/create'];

test.describe('mobile create-page overflow guardrails', () => {
    for (const route of CREATE_ROUTES) {
        test(`keeps interactive controls inside the viewport on ${route}`, async ({ page }) => {
            await page.setViewportSize(MOBILE_VIEWPORT);
            await page.goto(route);
            await page.waitForLoadState('networkidle');

            const metrics = await page.evaluate(() => {
                const docEl = document.documentElement;
                const main = document.querySelector('main');
                const mainRect = main?.getBoundingClientRect();
                const controls = Array.from(
                    document.querySelectorAll(
                        'main input:not([type="hidden"]), main textarea, main select, main button'
                    )
                );

                const rightmostControl = controls.reduce(
                    (max, element) => Math.max(max, element.getBoundingClientRect().right),
                    0
                );

                return {
                    docScrollWidth: docEl.scrollWidth,
                    docClientWidth: docEl.clientWidth,
                    bodyScrollWidth: document.body.scrollWidth,
                    mainRight: mainRect?.right ?? 0,
                    rightmostControl,
                    controlCount: controls.length,
                };
            });

            expect(metrics.controlCount).toBeGreaterThan(0);
            expect(metrics.docScrollWidth).toBeLessThanOrEqual(metrics.docClientWidth + 1);
            expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.docClientWidth + 1);
            expect(metrics.rightmostControl).toBeLessThanOrEqual(metrics.mainRight + 1);
        });
    }
});
