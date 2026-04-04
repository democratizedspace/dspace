import { chromium } from '@playwright/test';

const baseUrl = process.env.QUESTS_PERF_BASE_URL ?? 'http://127.0.0.1:3000';
const cpuSlowdown = Number.parseInt(process.env.QUESTS_PERF_CPU_SLOWDOWN ?? '1', 10);

const requiredMarks = [
    'quests:hydration-start',
    'quests:builtin-visible',
    'quests:snapshot-classification-ready',
    'quests:full-state-reconciled',
    'quests:custom-merged',
];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();
const cdp = await context.newCDPSession(page);

if (Number.isFinite(cpuSlowdown) && cpuSlowdown > 1) {
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpuSlowdown });
}

await page.goto(`${baseUrl}/quests`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

const summary = await page.evaluate((markNames) => {
    const marks = performance.getEntriesByType('mark');
    const byName = Object.fromEntries(marks.map((entry) => [entry.name, entry.startTime]));
    const result = {};

    for (const markName of markNames) {
        result[markName] = Number.isFinite(byName[markName]) ? Number(byName[markName]) : null;
    }

    return result;
}, requiredMarks);

console.log('Quests performance marks (milliseconds from navigation start):');
for (const markName of requiredMarks) {
    const value = summary[markName];
    console.log(`${markName}: ${value === null ? 'missing' : value.toFixed(2)}`);
}

await browser.close();
