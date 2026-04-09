import { test, expect } from '@playwright/test';
import { purgeClientState, waitForHydration } from './test-helpers';

type PerfEntrySummary = {
    name: string;
    startTime: number;
    duration: number;
};

const REQUIRED_MARKS = [
    'quests:list-hydration-start',
    'quests:list-visible',
    'quests:snapshot-classification-ready',
    'quests:full-state-reconciliation-complete',
] as const;

const REQUIRED_MEASURES = [
    'quests:time-to-list-visible',
    'quests:time-to-snapshot-classification',
    'quests:time-to-full-reconciliation',
] as const;

function parseCpuSlowdownFromEnv(): number {
    const rawValue = process.env.QUESTS_TTI_CPU_SLOWDOWN;
    const parsed = Number(rawValue ?? '1');

    if (!Number.isFinite(parsed) || parsed <= 0) {
        return 1;
    }

    return parsed;
}

test.describe('Quests TTI metrics', () => {
    test.beforeEach(async ({ page }) => {
        await purgeClientState(page);
    });

    test('captures required User Timing marks/measures for /quests', async ({
        page,
        browserName,
    }) => {
        test.skip(browserName !== 'chromium', 'CPU throttling harness targets chromium only.');

        const cpuSlowdown = parseCpuSlowdownFromEnv();

        if (cpuSlowdown > 1) {
            const cdpSession = await page.context().newCDPSession(page);
            await cdpSession.send('Emulation.setCPUThrottlingRate', { rate: cpuSlowdown });
        }

        await page.goto('/quests');
        await waitForHydration(page);
        await expect(page.getByTestId('quests-grid')).toBeVisible();

        await page.waitForFunction(
            ({ requiredMarks, requiredMeasures }) => {
                const hasMark = (name: string) =>
                    performance.getEntriesByName(name, 'mark').length > 0;
                const hasMeasure = (name: string) =>
                    performance.getEntriesByName(name, 'measure').length > 0;

                return (
                    requiredMarks.every((name: string) => hasMark(name)) &&
                    requiredMeasures.every((name: string) => hasMeasure(name))
                );
            },
            {
                requiredMarks: [...REQUIRED_MARKS],
                requiredMeasures: [...REQUIRED_MEASURES],
            }
        );

        const payload = await page.evaluate(
            ({ requiredMarks, requiredMeasures, cpuSlowdown: rate }) => {
                const marks = performance
                    .getEntriesByType('mark')
                    .filter((entry) => requiredMarks.includes(entry.name))
                    .map((entry) => ({
                        name: entry.name,
                        startTime: entry.startTime,
                        duration: entry.duration,
                    }));

                const measures = performance
                    .getEntriesByType('measure')
                    .filter((entry) => requiredMeasures.includes(entry.name))
                    .map((entry) => ({
                        name: entry.name,
                        startTime: entry.startTime,
                        duration: entry.duration,
                    }));

                return {
                    url: window.location.href,
                    cpuSlowdown: rate,
                    marks,
                    measures,
                };
            },
            {
                requiredMarks: [...REQUIRED_MARKS],
                requiredMeasures: [...REQUIRED_MEASURES],
                cpuSlowdown,
            }
        );

        for (const markName of REQUIRED_MARKS) {
            expect(payload.marks.some((mark) => mark.name === markName)).toBeTruthy();
        }

        for (const measureName of REQUIRED_MEASURES) {
            const measure = payload.measures.find((entry) => entry.name === measureName);
            expect(measure).toBeDefined();
            expect(Number.isFinite(measure?.duration)).toBeTruthy();
            expect((measure?.duration ?? -1) >= 0).toBeTruthy();
        }

        console.log(`QUESTS_TTI_METRICS ${JSON.stringify(payload)}`);
    });
});
