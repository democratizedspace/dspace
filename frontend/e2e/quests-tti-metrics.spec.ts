import { test, expect } from '@playwright/test';
import { clearUserData } from './test-helpers';

const PERF_MARKS = [
    'quests:list-hydration-start',
    'quests:list-visible',
    'quests:snapshot-classification-ready',
    'quests:full-state-reconciliation-complete',
    'quests:custom-quests-merge-complete',
];

test.describe('quests performance marks', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('collects /quests user timing milestones', async ({ page, browserName }) => {
        test.skip(browserName !== 'chromium', 'Measurement harness is Chromium-focused');

        const cpuSlowdown = Number(process.env.QUESTS_TTI_CPU_SLOWDOWN ?? '1');
        if (cpuSlowdown > 1) {
            const session = await page.context().newCDPSession(page);
            await session.send('Emulation.setCPUThrottlingRate', { rate: cpuSlowdown });
        }

        await page.goto('/quests');
        await page.waitForLoadState('networkidle');

        await expect(page.getByTestId('quests-grid')).toBeVisible();

        const metrics = await page.evaluate((marks) => {
            const allMarks = performance.getEntriesByType('mark');
            const allMeasures = performance.getEntriesByType('measure');

            const markTimes = Object.fromEntries(
                marks.map((name) => {
                    const entry = allMarks.find((mark) => mark.name === name);
                    return [name, entry ? Number(entry.startTime.toFixed(2)) : null];
                })
            );

            const measureTimes = Object.fromEntries(
                allMeasures
                    .filter((entry) => entry.name.startsWith('quests:time-to-'))
                    .map((entry) => [entry.name, Number(entry.duration.toFixed(2))])
            );

            return { markTimes, measureTimes };
        }, PERF_MARKS);

        for (const markName of PERF_MARKS.slice(0, 4)) {
            expect(metrics.markTimes[markName]).not.toBeNull();
        }

        console.log('[quests-tti-metrics]', JSON.stringify({ cpuSlowdown, ...metrics }, null, 2));
    });
});
