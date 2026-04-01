import { expect, test } from '@playwright/test';

const MOBILE_VIEWPORT = { width: 375, height: 667 };
const CREATE_ROUTES = [
    { route: '/processes/create', formSelector: 'form.process-form' },
    { route: '/inventory/create', formSelector: 'form.item-form' },
    { route: '/quests/create', formSelector: 'form.quest-form' },
];

test.describe('mobile create-page overflow guardrails', () => {
    for (const { route, formSelector } of CREATE_ROUTES) {
        test(`keeps interactive controls inside the viewport on ${route}`, async ({ page }) => {
            await page.setViewportSize(MOBILE_VIEWPORT);
            await page.goto(route);
            await page.waitForLoadState('networkidle');

            const metrics = await page.evaluate(
                ({ formSelector }) => {
                    const docEl = document.documentElement;
                    const form = document.querySelector(formSelector);
                    const formRect = form?.getBoundingClientRect();
                    const controls = Array.from(
                        document.querySelectorAll(
                            `${formSelector} input:not([type="hidden"]), ${formSelector} textarea, ${formSelector} select, ${formSelector} button`
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
                        formRight: formRect?.right ?? 0,
                        rightmostControl,
                        controlCount: controls.length,
                        formFound: Boolean(form),
                    };
                },
                { formSelector }
            );

            expect(metrics.formFound).toBeTruthy();
            expect(metrics.controlCount).toBeGreaterThan(0);
            expect(metrics.docScrollWidth).toBeLessThanOrEqual(metrics.docClientWidth + 1);
            expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.docClientWidth + 1);
            expect(metrics.rightmostControl).toBeLessThanOrEqual(metrics.formRight + 1);
        });
    }
});
