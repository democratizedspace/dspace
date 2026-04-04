import { test, expect } from '@playwright/test';
import { purgeClientState } from './test-helpers';

const REQUIRED_MARKS = [
    'quests:route-hydration-start',
    'quests:builtins-visible',
    'quests:snapshot-classification-ready',
    'quests:fullstate-reconciliation-complete',
];

test.describe('/quests performance instrumentation', () => {
    test('emits stable user timing milestones', async ({ page, context, browserName }) => {
        await purgeClientState(page);

        const cpuSlowdown = Number(process.env.QUESTS_PERF_CPU_SLOWDOWN ?? '1');
        if (browserName === 'chromium' && cpuSlowdown > 1) {
            const session = await context.newCDPSession(page);
            await session.send('Emulation.setCPUThrottlingRate', { rate: cpuSlowdown });
        }

        await page.goto('/quests');
        await expect(page.getByTestId('quests-grid')).toBeVisible();

        await page.waitForFunction(
            (names) => names.every((name) => performance.getEntriesByName(name).length > 0),
            REQUIRED_MARKS
        );

        const timingData = await page.evaluate(() => {
            const marks = performance
                .getEntriesByType('mark')
                .filter((entry) => entry.name.startsWith('quests:'))
                .map((entry) => ({ name: entry.name, startTime: Math.round(entry.startTime) }));
            const measures = performance
                .getEntriesByType('measure')
                .filter((entry) => entry.name.startsWith('quests:time-to-'))
                .map((entry) => ({
                    name: entry.name,
                    duration: Math.round(entry.duration),
                }));

            return { marks, measures };
        });

        for (const requiredMark of REQUIRED_MARKS) {
            expect(timingData.marks.some((mark) => mark.name === requiredMark)).toBe(true);
        }

        console.log('[quests-perf] summary', JSON.stringify(timingData));
    });
});
