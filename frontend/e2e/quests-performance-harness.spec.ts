import { test, expect } from '@playwright/test';
import { clearUserData } from './test-helpers';

const MEASURE_NAMES = [
    'quests:time-to-builtin-visible',
    'quests:time-to-snapshot-ready',
    'quests:time-to-full-reconciliation',
    'quests:time-to-custom-merge',
] as const;

test.describe('Quests performance harness', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('collects /quests user timing milestones', async ({ page, browserName }) => {
        test.skip(browserName !== 'chromium', 'Harness is tuned for Chromium traces/timing.');

        const session = await page.context().newCDPSession(page);
        await session.send('Emulation.setCPUThrottlingRate', {
            rate: Number(process.env.QUESTS_PERF_CPU_THROTTLE ?? '1'),
        });

        await page.goto('/quests');
        await expect(page.locator('[data-testid="quests-grid"] a').first()).toBeVisible();

        await page.waitForFunction(
            (required) => {
                const names = performance.getEntriesByType('measure').map((entry) => entry.name);
                return required.every((name: string) => names.includes(name));
            },
            MEASURE_NAMES,
            { timeout: 20000 }
        );

        const measures = await page.evaluate((requiredNames) => {
            const allMeasures = performance.getEntriesByType('measure');
            const selected = allMeasures
                .filter((entry) => requiredNames.includes(entry.name))
                .map((entry) => ({
                    name: entry.name,
                    durationMs: Number(entry.duration.toFixed(2)),
                }))
                .sort((a, b) => a.name.localeCompare(b.name));

            return selected;
        }, MEASURE_NAMES);

        // eslint-disable-next-line no-console
        console.log(`\n[quests-perf] cpuThrottle=${process.env.QUESTS_PERF_CPU_THROTTLE ?? '1'}x`);
        measures.forEach((entry) => {
            // eslint-disable-next-line no-console
            console.log(`[quests-perf] ${entry.name}: ${entry.durationMs}ms`);
        });

        expect(measures).toHaveLength(MEASURE_NAMES.length);
    });
});
