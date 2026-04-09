import { test, expect } from '@playwright/test';
import { clearUserData } from './test-helpers';

const PERF_MARKS = [
    'quests:list-hydration-start',
    'quests:list-visible',
    'quests:snapshot-classification-ready',
    'quests:full-state-reconciliation-complete',
];
// Intentionally not emitted on this baseline; kept for comparable JSON shape vs v3.0.1.
const OPTIONAL_PERF_MARKS = ['quests:custom-quests-merge-complete'];

test.describe('quests performance marks', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('collects /quests user timing milestones', async ({ page, browserName, baseURL }) => {
        test.skip(browserName !== 'chromium', 'Measurement harness is Chromium-focused');

        const cpuSlowdown = Number(process.env.QUESTS_TTI_CPU_SLOWDOWN ?? '1');
        if (cpuSlowdown > 1) {
            const session = await page.context().newCDPSession(page);
            await session.send('Emulation.setCPUThrottlingRate', { rate: cpuSlowdown });
        }

        await page.goto('/quests');
        await page.waitForLoadState('networkidle');

        const configuredBaseUrl =
            process.env.QUESTS_PERF_BASE_URL || process.env.BASE_URL || baseURL || page.url();
        if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(configuredBaseUrl)) {
            throw new Error(
                `Invalid quests perf base URL "${configuredBaseUrl}": include scheme (e.g. http:// or https://).`
            );
        }
        const configuredOrigin = new URL(configuredBaseUrl).origin;
        const loadedUrl = new URL(page.url());

        expect(loadedUrl.origin).toBe(configuredOrigin);
        expect(loadedUrl.pathname).toBe('/quests');
        await expect(page.getByRole('heading', { name: 'Quests', exact: true })).toBeVisible();
        await expect(page.getByTestId('quests-grid')).toBeVisible();
        await page.waitForFunction(
            (requiredMarks) =>
                requiredMarks.every((name) =>
                    performance.getEntriesByName(name, 'mark').some(Boolean)
                ),
            PERF_MARKS
        );

        const metrics = await page.evaluate(
            (marks) => {
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
            },
            [...PERF_MARKS, ...OPTIONAL_PERF_MARKS]
        );

        for (const markName of PERF_MARKS) {
            expect(metrics.markTimes[markName]).not.toBeNull();
        }

        console.log('[quests-tti-metrics]', JSON.stringify({ cpuSlowdown, ...metrics }, null, 2));
    });
});
