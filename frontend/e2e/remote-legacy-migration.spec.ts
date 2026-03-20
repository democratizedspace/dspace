import { test, expect, type Page } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { waitForHydration } from './test-helpers';

type CheckResult = {
    id: string;
    area: string;
    status: 'pass' | 'fail';
    note?: string;
};

type LegacyFixtureProfiles = {
    profiles?: Record<string, { label?: string; gameState?: Record<string, unknown> }>;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const reportPath = join(__dirname, '..', 'test-results', 'remote-migration-report.json');
const v2FixturePath = join(
    __dirname,
    '..',
    'src',
    'utils',
    'legacySaveFixtures',
    'legacy_v2_localstorage_save.json'
);

const rawV2Fixture = JSON.parse(readFileSync(v2FixturePath, 'utf8')) as LegacyFixtureProfiles;

const fixtureProfiles = rawV2Fixture.profiles ?? {};

const builtInV2Scenarios: Array<{ id: string; state: Record<string, unknown> }> = Object.entries(
    fixtureProfiles
)
    .map(([id, profile]) => ({ id, state: profile?.gameState ?? {} }))
    .filter(({ state }) => state && typeof state === 'object');

const realV2InputRaw = process.env.REMOTE_MIGRATION_REAL_V2_JSON || '';
const realV2Scenario = (() => {
    if (!realV2InputRaw) return null;
    try {
        const parsed = JSON.parse(realV2InputRaw);
        if (!parsed || typeof parsed !== 'object') {
            return null;
        }
        return { id: 'real-v2', state: parsed as Record<string, unknown> };
    } catch {
        return null;
    }
})();

function persistReport(checks: CheckResult[]): void {
    const payload = {
        generatedAt: new Date().toISOString(),
        baseURL: process.env.BASE_URL || '',
        checks,
        manualOnly: [
            'DevTools-level verification of IndexedDB object stores and raw cookie attributes.',
            'Storage quota pressure and partial-write UX behavior.',
            'Cross-browser + mobile profile validation with genuine historical data.',
            'Long-tail performance with extremely large legacy payloads.',
            'Security/audit review of production telemetry and logs.',
        ],
    };

    mkdirSync(dirname(reportPath), { recursive: true });
    writeFileSync(reportPath, JSON.stringify(payload, null, 2));
}

async function resetStorage(page: Page): Promise<void> {
    await page.context().clearCookies();
    await page.goto('/');
    await waitForHydration(page);

    await page.evaluate(async () => {
        localStorage.clear();
        sessionStorage.clear();

        const dbNames = ['dspaceGameState', 'CustomContent', 'dspaceDB', 'dspaceGameSaves'];
        await Promise.all(
            dbNames.map(
                (name) =>
                    new Promise<void>((resolve) => {
                        try {
                            const request = indexedDB.deleteDatabase(name);
                            request.onsuccess = () => resolve();
                            request.onerror = () => resolve();
                            request.onblocked = () => resolve();
                        } catch {
                            resolve();
                        }
                    })
            )
        );

        const cookieNames = document.cookie
            .split(';')
            .map((cookie) => cookie.split('=')[0]?.trim())
            .filter(Boolean);

        cookieNames.forEach((name) => {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
        });
    });
}

async function gotoSettings(page: Page): Promise<void> {
    await page.goto('/settings');
    await waitForHydration(page);
    await expect(page.getByRole('heading', { level: 2, name: 'Settings' })).toBeVisible();
    await expect(
        page.getByRole('heading', { level: 2, name: 'Legacy save upgrades' })
    ).toBeVisible();
}

async function seedV1CookieState(page: Page): Promise<void> {
    const origin = new URL(page.url());
    const cookieUrl = `${origin.protocol}//${origin.host}`;

    await page.context().addCookies([
        { name: 'item-3', value: encodeURIComponent('120.5'), url: cookieUrl, path: '/' },
        { name: 'item-10', value: encodeURIComponent('2'), url: cookieUrl, path: '/' },
        {
            name: 'currency-balance-dUSD',
            value: encodeURIComponent('300'),
            url: cookieUrl,
            path: '/',
        },
    ]);
}

async function seedV2LocalStorage(page: Page, state: Record<string, unknown>): Promise<void> {
    await page.evaluate(
        ({ payload }) => {
            localStorage.setItem('gameState', JSON.stringify(payload));
            localStorage.removeItem('gameStateBackup');
            localStorage.removeItem('legacyV2Seeded');
        },
        { payload: state }
    );
}

test.describe('Remote legacy migration harness', () => {
    test.describe.configure({ mode: 'serial' });
    test.setTimeout(240_000);

    test('covers the 3.2.2 migration matrix subset with explicit residual manual work', async ({
        page,
    }) => {
        const checks: CheckResult[] = [];

        async function runCheck(id: string, area: string, fn: () => Promise<void>) {
            try {
                await fn();
                checks.push({ id, area, status: 'pass' });
            } catch (error) {
                checks.push({
                    id,
                    area,
                    status: 'fail',
                    note: error instanceof Error ? error.message : String(error),
                });
            }
        }

        await runCheck('v1-detection-banner', '3.2.2-B', async () => {
            await resetStorage(page);
            await gotoSettings(page);
            await expect(page.getByText(/No v1 cookie data detected/i)).toBeVisible();

            await seedV1CookieState(page);
            await page.reload();
            await waitForHydration(page);
            await expect(page.getByTestId('legacy-v1-cookie-summary')).not.toHaveText(
                /No v1 cookie data detected/i
            );

            await page.goto('/quests');
            await waitForHydration(page);
            await expect(page.getByText(/Legacy save detected/i)).toBeVisible();
        });

        await runCheck('v1-merge-replace-cleanup', '3.2.2-B', async () => {
            await gotoSettings(page);
            await page.getByRole('button', { name: 'Merge v1 into current save' }).click();
            await expect(page.getByText(/Merged v1 items into your current save/i)).toBeVisible();

            await page.goto('/inventory');
            await waitForHydration(page);
            await expect(page.getByText(/Early Adopter Token/i)).toBeVisible();

            await gotoSettings(page);
            await seedV1CookieState(page);
            await page.reload();
            await waitForHydration(page);

            await page.getByRole('button', { name: 'Replace current save with v1' }).click();
            await expect(
                page.getByText(/Replaced current save with converted v1 data/i)
            ).toBeVisible();

            await page.getByRole('button', { name: 'Delete v1 cookie data' }).click();
            await expect(page.getByText(/Removed legacy v1 cookies/i)).toBeVisible();

            await page.goto('/quests');
            await waitForHydration(page);
            await expect(page.getByText(/Legacy save detected/i)).toHaveCount(0);
        });

        await runCheck('v2-detection-merge-replace', '3.2.2-C', async () => {
            await resetStorage(page);
            await gotoSettings(page);

            const minimalState =
                builtInV2Scenarios.find((entry) => entry.id === 'minimal')?.state ??
                builtInV2Scenarios[0]?.state;
            expect(minimalState, 'Expected at least one built-in v2 fixture profile').toBeTruthy();

            await seedV2LocalStorage(page, minimalState as Record<string, unknown>);
            await page.reload();
            await waitForHydration(page);
            await expect(page.getByText(/Legacy v2 localStorage data detected/i)).toBeVisible();

            await page.getByRole('button', { name: 'Merge v2 into current save' }).click();
            await expect(
                page.getByText(/Merged compatible legacy v2 data into your current save/i)
            ).toBeVisible();

            await page.goto('/inventory');
            await waitForHydration(page);
            await expect(page.getByText(/V2 Upgrade Trophy/i)).toBeVisible();

            await gotoSettings(page);
            await seedV2LocalStorage(page, minimalState as Record<string, unknown>);
            await page.reload();
            await waitForHydration(page);

            await page.getByRole('button', { name: 'Replace current save with v2' }).click();
            await expect(
                page.getByText(/Replaced the current save with migrated v2 data/i)
            ).toBeVisible();
        });

        await runCheck('v2-auto-vs-manual-cleanup', '3.2.2-A/C', async () => {
            await resetStorage(page);
            await gotoSettings(page);
            const state = builtInV2Scenarios[0]?.state ?? {
                versionNumberString: '2.1',
                inventory: {},
            };

            await seedV2LocalStorage(page, state as Record<string, unknown>);
            await page.reload();
            await waitForHydration(page);

            await page.getByRole('button', { name: 'Merge v2 into current save' }).click();
            await expect(page.getByText(/Reloading…/i)).toBeVisible();

            await page.waitForTimeout(2500);
            await waitForHydration(page);

            const manualCleanupState = await page.evaluate(() => {
                const raw = localStorage.getItem('gameState');
                return raw ? JSON.parse(raw) : null;
            });

            if (manualCleanupState?.versionNumberString === '2.1') {
                throw new Error(
                    'Manual migration left a legacy v2 payload in localStorage.gameState'
                );
            }

            await resetStorage(page);
            await page.goto('/');
            await waitForHydration(page);
            await seedV2LocalStorage(page, state as Record<string, unknown>);

            await page.goto('/quests');
            await waitForHydration(page);

            const autoCleanupRaw = await page.evaluate(() => localStorage.getItem('gameState'));
            if (autoCleanupRaw !== null) {
                const parsed = JSON.parse(autoCleanupRaw);
                if (parsed?.versionNumberString === '2.1') {
                    throw new Error(
                        'Auto migration left legacy v2 payload in localStorage.gameState'
                    );
                }
            }
        });

        await runCheck('v2-missing-keys-safe-defaults', '3.2.2-D', async () => {
            await resetStorage(page);
            await gotoSettings(page);

            await seedV2LocalStorage(page, {
                versionNumberString: '2.1',
                inventory: { 3: 2.5 },
            });

            await page.reload();
            await waitForHydration(page);
            await expect(page.getByText(/Legacy v2 localStorage data detected/i)).toBeVisible();

            await page.getByRole('button', { name: 'Merge v2 into current save' }).click();
            await expect(
                page.getByText(/Merged compatible legacy v2 data into your current save/i)
            ).toBeVisible();
        });

        await runCheck('v2-malformed-json-warning', '3.2.2-D', async () => {
            await resetStorage(page);
            await gotoSettings(page);

            await page.evaluate(() => {
                localStorage.setItem('gameState', '{bad json');
            });

            await page.reload();
            await waitForHydration(page);
            await expect(page.getByText(/Legacy v2 data could not be parsed/i)).toBeVisible();
        });

        await runCheck('v1-malformed-cookie-tolerance', '3.2.2-D', async () => {
            await resetStorage(page);
            await gotoSettings(page);
            const origin = new URL(page.url());
            const cookieUrl = `${origin.protocol}//${origin.host}`;

            await page.context().addCookies([
                { name: 'item-3', value: 'NaN', url: cookieUrl, path: '/' },
                { name: 'item-10', value: encodeURIComponent('-5'), url: cookieUrl, path: '/' },
            ]);

            await page.reload();
            await waitForHydration(page);
            await expect(page.getByText(/Some v1 cookies were ignored/i)).toBeVisible();
        });

        await runCheck('fixtures-sweep-v2-detection', '3.2.2-C/D', async () => {
            for (const scenario of builtInV2Scenarios) {
                await resetStorage(page);
                await gotoSettings(page);
                await seedV2LocalStorage(page, scenario.state);
                await page.reload();
                await waitForHydration(page);
                await expect(
                    page.getByText(/Legacy v2 localStorage data detected/i),
                    `Fixture ${scenario.id} should be detected as legacy v2.`
                ).toBeVisible();
            }
        });

        await runCheck('real-v2-input-detection-and-merge', '3.2.2-C', async () => {
            if (!realV2Scenario) {
                return;
            }

            await resetStorage(page);
            await gotoSettings(page);
            await seedV2LocalStorage(page, realV2Scenario?.state ?? {});
            await page.reload();
            await waitForHydration(page);
            await expect(page.getByText(/Legacy v2 localStorage data detected/i)).toBeVisible();
            await page.getByRole('button', { name: 'Merge v2 into current save' }).click();
            await expect(
                page.getByText(/Merged compatible legacy v2 data into your current save/i)
            ).toBeVisible();
        });

        persistReport(checks);

        const failed = checks.filter((entry) => entry.status === 'fail');
        expect(
            failed,
            `Remote migration harness failures: ${JSON.stringify(failed, null, 2)}`
        ).toEqual([]);
    });
});
