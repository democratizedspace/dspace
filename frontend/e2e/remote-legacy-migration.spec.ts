import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { waitForHydration } from './test-helpers';

type V1CookieFixture = {
    name: string;
    value: string | number;
    encodeValue?: boolean;
};

type V1FixtureProfile = {
    label?: string;
    cookies?: V1CookieFixture[];
};

type V2FixtureProfile = {
    label?: string;
    gameState?: Record<string, unknown>;
};

type ReportEntry = {
    area: string;
    status: 'pass' | 'fail' | 'info';
    detail: string;
};

const LEGACY_BANNER_TEXT = 'Legacy save detected — upgrade to v3 ASAP.';
const SETTINGS_ROUTE = '/settings';

const v1Fixture = JSON.parse(
    readFileSync(resolve(process.cwd(), 'src/utils/legacySaveFixtures/legacy_v1_cookie_save.json'), 'utf8')
) as { profiles?: Record<string, V1FixtureProfile> };
const v2Fixture = JSON.parse(
    readFileSync(
        resolve(process.cwd(), 'src/utils/legacySaveFixtures/legacy_v2_localstorage_save.json'),
        'utf8'
    )
) as { profiles?: Record<string, V2FixtureProfile> };

const realV2PayloadRaw = process.env.REMOTE_MIGRATION_REAL_V2_JSON_B64
    ? Buffer.from(process.env.REMOTE_MIGRATION_REAL_V2_JSON_B64, 'base64').toString('utf8')
    : '';
const realV2Payload = realV2PayloadRaw ? (JSON.parse(realV2PayloadRaw) as Record<string, unknown>) : null;

async function clearAllSaveData(page: Page): Promise<void> {
    await page.context().clearCookies();
    await page.goto('/');
    await page.evaluate(async () => {
        localStorage.clear();
        sessionStorage.clear();

        const knownDatabases = ['dspaceGameState', 'CustomContent', 'dspaceDB', 'dspaceGameSaves'];
        await Promise.all(
            knownDatabases.map(
                (name) =>
                    new Promise<void>((resolveDelete) => {
                        try {
                            const request = indexedDB.deleteDatabase(name);
                            request.onsuccess = () => resolveDelete();
                            request.onerror = () => resolveDelete();
                            request.onblocked = () => resolveDelete();
                        } catch {
                            resolveDelete();
                        }
                    })
            )
        );
    });
}

async function goToSettings(page: Page): Promise<void> {
    await page.goto(SETTINGS_ROUTE);
    await page.waitForLoadState('domcontentloaded');
    await waitForHydration(page);
    await expect(page.getByRole('heading', { name: 'Legacy save upgrades' })).toBeVisible();
}

async function seedV1Cookies(context: BrowserContext, cookies: V1CookieFixture[], baseURL: string) {
    const url = new URL(baseURL);
    const seeded = cookies
        .filter((entry) => entry?.name)
        .map((entry) => ({
            name: entry.name,
            value: entry.encodeValue === false ? String(entry.value) : encodeURIComponent(String(entry.value)),
            domain: url.hostname,
            path: '/',
            httpOnly: false,
            secure: url.protocol === 'https:',
            sameSite: 'Lax' as const,
            expires: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
        }));

    if (seeded.length > 0) {
        await context.addCookies(seeded);
    }
}

async function seedV2LocalStorage(page: Page, payload: Record<string, unknown>, key: 'gameState' | 'gameStateBackup' = 'gameState') {
    await page.goto('/');
    await page.evaluate(
        ({ legacyPayload, storageKey }) => {
            localStorage.setItem(storageKey, JSON.stringify(legacyPayload));
            localStorage.removeItem('legacyV2Seeded');
        },
        { legacyPayload: payload, storageKey: key }
    );
}

async function expectBannerVisible(page: Page): Promise<void> {
    await page.goto('/quests');
    await waitForHydration(page);
    await expect(page.getByText(LEGACY_BANNER_TEXT)).toBeVisible();
}

async function expectBannerHidden(page: Page): Promise<void> {
    await page.goto('/quests');
    await waitForHydration(page);
    await expect(page.getByText(LEGACY_BANNER_TEXT)).toHaveCount(0);
}

async function clickAndWaitForStatus(page: Page, buttonName: RegExp, statusSnippet: RegExp): Promise<void> {
    await page.getByRole('button', { name: buttonName }).click();
    const status = page.locator('p.status').first();
    await expect(status).toContainText(statusSnippet, { timeout: 15_000 });
}

test.describe('Remote legacy migration harness', () => {
    test.describe.configure({ mode: 'serial' });
    test.setTimeout(240_000);

    test('automates legacy migration matrix residue for remote targets', async ({ page, baseURL }, testInfo) => {
        const report: ReportEntry[] = [];

        if (!baseURL) {
            throw new Error('BASE_URL is required for remote migration harness');
        }

        const v1Minimal = v1Fixture.profiles?.minimal;
        const v1Maximal = v1Fixture.profiles?.maximal;
        const v2Minimal = v2Fixture.profiles?.minimal?.gameState;
        const v2InProgress = v2Fixture.profiles?.inProgress?.gameState;

        if (!v1Minimal?.cookies || !v1Maximal?.cookies || !v2Minimal || !v2InProgress) {
            throw new Error('Legacy fixture profiles are missing required seeded payloads.');
        }

        await clearAllSaveData(page);
        await goToSettings(page);
        await expect(page.getByText('No v1 cookie data detected')).toBeVisible();
        await expect(page.getByText('No v2 localStorage data detected')).toBeVisible();
        report.push({
            area: 'v1/v2 clean-state detection',
            status: 'pass',
            detail: 'No banner/cards shown when no legacy artifacts exist.',
        });

        await seedV1Cookies(page.context(), v1Minimal.cookies, baseURL);
        await expectBannerVisible(page);
        await goToSettings(page);
        await expect(page.getByTestId('legacy-v1-cookie-summary')).not.toContainText('No v1 cookie data detected');
        report.push({
            area: 'v1 detection + banner',
            status: 'pass',
            detail: 'Seeded v1 cookies show banner and v1 card detection.',
        });

        await clickAndWaitForStatus(page, /Merge v1 into current save/i, /Merged v1 items into your current save/i);
        await page.waitForTimeout(300);
        await expectBannerHidden(page);
        report.push({
            area: 'v1 merge + cleanup banner behavior',
            status: 'pass',
            detail: 'Merge action succeeds and banner clears after migrated cookies are expired.',
        });

        await seedV1Cookies(page.context(), v1Maximal.cookies, baseURL);
        await goToSettings(page);
        await expect(page.getByText(/Current v3 data exists/i)).toBeVisible();
        await clickAndWaitForStatus(page, /Replace current save with v1/i, /Replaced current save with converted v1 data/i);
        await page.getByRole('button', { name: /Delete v1 cookie data/i }).click();
        await expectBannerHidden(page);
        report.push({
            area: 'v1 replace path',
            status: 'pass',
            detail: 'Replace action runs with existing v3 warning visible and cleanup control works.',
        });

        await seedV2LocalStorage(page, v2Minimal);
        await expectBannerVisible(page);
        await goToSettings(page);
        await expect(page.getByText(/Legacy v2 localStorage data detected/i)).toBeVisible();
        await expect(page.getByText(/Current v3 data exists/i)).toBeVisible();
        report.push({
            area: 'v2 detection',
            status: 'pass',
            detail: 'Legacy v2 localStorage payload is detected and warns when v3 state exists.',
        });

        await clickAndWaitForStatus(page, /Merge v2 into current save/i, /Merged compatible legacy v2 data into your current save/i);
        await page.waitForTimeout(2600);
        await goToSettings(page);
        const gameStateAfterManualMerge = await page.evaluate(() => localStorage.getItem('gameState'));
        expect(gameStateAfterManualMerge).not.toBeNull();
        expect(gameStateAfterManualMerge).not.toContain('"versionNumberString":"2.1"');
        report.push({
            area: 'v2 merge (manual cleanup behavior)',
            status: 'pass',
            detail: 'Manual merge rewrites localStorage key away from legacy v2 payload shape.',
        });

        await seedV2LocalStorage(page, v2InProgress);
        await goToSettings(page);
        await clickAndWaitForStatus(page, /Replace current save with v2/i, /Replaced the current save with migrated v2 data/i);
        await page.waitForTimeout(2600);
        await goToSettings(page);
        const v2LegacyDetectedAfterReplace = page.getByText(/Legacy v2 localStorage data detected/i);
        await expect(v2LegacyDetectedAfterReplace).toHaveCount(0);
        report.push({
            area: 'v2 replace',
            status: 'pass',
            detail: 'Replace action succeeds and v2 detection card clears after migration.',
        });

        await seedV2LocalStorage(page, v2Minimal, 'gameStateBackup');
        await page.goto('/');
        await page.waitForTimeout(800);
        await goToSettings(page);
        const backupKeyAfterAuto = await page.evaluate(() => localStorage.getItem('gameStateBackup'));
        expect(backupKeyAfterAuto).toBeNull();
        report.push({
            area: 'auto cleanup behavior (backup-only)',
            status: 'pass',
            detail: 'Auto migration consumes backup-only payload and removes legacy backup key.',
        });

        await page.goto('/');
        await page.evaluate(() => {
            localStorage.setItem('gameState', '{"versionNumberString":"2.1"');
        });
        await goToSettings(page);
        await expect(page.getByText(/Legacy v2 data could not be parsed/i)).toBeVisible();
        report.push({
            area: 'malformed v2 input handling',
            status: 'pass',
            detail: 'Invalid JSON produces explicit parse warning without app crash.',
        });

        await seedV2LocalStorage(page, { versionNumberString: '2.1' });
        await goToSettings(page);
        await clickAndWaitForStatus(page, /Merge v2 into current save/i, /Merged compatible legacy v2 data into your current save/i);
        report.push({
            area: 'missing v2 keys handling',
            status: 'pass',
            detail: 'Migration path tolerates missing inventory/quests/processes keys.',
        });

        if (realV2Payload) {
            await seedV2LocalStorage(page, realV2Payload);
            await goToSettings(page);
            await expect(page.getByText(/Legacy v2 localStorage data detected/i)).toBeVisible();
            await clickAndWaitForStatus(page, /Merge v2 into current save/i, /Merged compatible legacy v2 data into your current save/i);
            report.push({
                area: 'real v2 payload ingestion',
                status: 'pass',
                detail: 'User-provided payload was detected and migrated through the same UI flow.',
            });
        } else {
            report.push({
                area: 'real v2 payload ingestion',
                status: 'info',
                detail: 'Skipped (provide --real-v2-save or REMOTE_MIGRATION_REAL_V2_JSON).',
            });
        }

        const lines = report.map((entry) => {
            const icon = entry.status === 'pass' ? '✅' : entry.status === 'fail' ? '❌' : 'ℹ️';
            return `${icon} ${entry.area}: ${entry.detail}`;
        });

        const reportText = ['[qa:remote-migration] matrix summary', ...lines].join('\n');
        console.log(reportText);

        const reportPath = testInfo.outputPath('remote-migration-checklist.txt');
        writeFileSync(reportPath, reportText, 'utf8');
        await testInfo.attach('remote-migration-checklist', {
            path: reportPath,
            contentType: 'text/plain',
        });
    });
});
