import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';
import { waitForHydration } from './test-helpers';

type CheckResult = {
    id: string;
    label: string;
    status: 'pass' | 'fail';
    error?: string;
};

type V1FixtureProfile = {
    label?: string;
    cookies?: Array<{ name?: string; value?: string | number; encodeValue?: boolean }>;
};

type V2State = Record<string, unknown>;

type V2FixtureProfile = {
    label?: string;
    gameState?: V2State;
};

type V1Fixture = {
    profiles?: Record<string, V1FixtureProfile>;
};

type V2Fixture = {
    profiles?: Record<string, V2FixtureProfile>;
};

const REPORT_FILE = process.env.REMOTE_MIGRATION_REPORT_FILE;
const REAL_V2_SAVE_LABEL = process.env.REMOTE_MIGRATION_REAL_V2_LABEL ?? 'real-v2-save';

const MANUAL_RESIDUE = [
    'DevTools/network-level storage validation (IndexedDB internals, cookie domain/path edge cases).',
    'Quota-pressure and write-failure recovery under constrained storage.',
    'Cross-browser + mobile behavior beyond the selected Playwright project.',
    'Staging/prod environment toggles that suppress QA cheats panel (manual confirmation).',
    'Human review of item-by-item migration correctness for very large real-world saves.',
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const V1_FIXTURE_PATH = path.resolve(
    PROJECT_ROOT,
    'src/utils/legacySaveFixtures/legacy_v1_cookie_save.json'
);
const V2_FIXTURE_PATH = path.resolve(
    PROJECT_ROOT,
    'src/utils/legacySaveFixtures/legacy_v2_localstorage_save.json'
);

const v1Fixture = JSON.parse(fs.readFileSync(V1_FIXTURE_PATH, 'utf8')) as V1Fixture;
const v2Fixture = JSON.parse(fs.readFileSync(V2_FIXTURE_PATH, 'utf8')) as V2Fixture;

const checkResults: CheckResult[] = [];

const parseRealV2Save = (): V2State | null => {
    const raw = process.env.REMOTE_MIGRATION_REAL_V2_SAVE;
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            throw new Error('Real v2 save must be a JSON object.');
        }
        return parsed as V2State;
    } catch (error) {
        throw new Error(`Unable to parse REMOTE_MIGRATION_REAL_V2_SAVE: ${String(error)}`);
    }
};

const realV2Save = parseRealV2Save();

function normalizeError(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}

async function runCheck(id: string, label: string, fn: () => Promise<void>): Promise<void> {
    try {
        await test.step(`${id} ${label}`, fn);
        checkResults.push({ id, label, status: 'pass' });
    } catch (error) {
        checkResults.push({ id, label, status: 'fail', error: normalizeError(error) });
    }
}

async function goToSettings(page: Page): Promise<void> {
    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');
    await waitForHydration(page);
    await expect(page.getByRole('heading', { level: 2, name: 'Settings' })).toBeVisible();
}

async function ensureQaCheatsEnabledIfPresent(page: Page): Promise<void> {
    const toggle = page.getByTestId('qa-cheats-toggle');
    if ((await toggle.count()) === 0) return;

    await expect(toggle).toBeVisible();
    const pressed = await toggle.getAttribute('aria-pressed');
    if (pressed !== 'true') {
        await toggle.click();
    }
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
}

async function clearBrowserState(page: Page): Promise<void> {
    await page.context().clearCookies();
    await page.goto('/');
    await waitForHydration(page);
    await page.evaluate(async () => {
        localStorage.clear();
        sessionStorage.clear();
        const dbNames = ['dspaceGameState', 'dspaceDB', 'dspaceGameSaves', 'CustomContent'];
        await Promise.all(
            dbNames.map(
                (name) =>
                    new Promise<void>((resolve) => {
                        const request = indexedDB.deleteDatabase(name);
                        request.onsuccess = () => resolve();
                        request.onerror = () => resolve();
                        request.onblocked = () => resolve();
                    })
            )
        );
    });
}

async function seedV1Profile(page: Page, profileId: string): Promise<void> {
    await goToSettings(page);
    await ensureQaCheatsEnabledIfPresent(page);

    const profileSelect = page.locator('label:has-text("V1 seed profile") select').first();
    const seedButton = page.getByRole('button', { name: 'Seed v1 save' });

    if ((await profileSelect.count()) > 0 && (await seedButton.count()) > 0) {
        await profileSelect.selectOption(profileId);
        await seedButton.click();
        await page.waitForLoadState('domcontentloaded');
        await waitForHydration(page);
        return;
    }

    const profile = v1Fixture.profiles?.[profileId];
    if (!profile?.cookies?.length) {
        throw new Error(`Missing fallback v1 fixture profile: ${profileId}`);
    }

    await page.goto('/');
    await waitForHydration(page);
    await page.evaluate((cookies) => {
        const secure = location.protocol === 'https:' ? '; Secure' : '';
        cookies.forEach((entry) => {
            if (!entry?.name) return;
            const value =
                entry.encodeValue === false
                    ? String(entry.value ?? '')
                    : encodeURIComponent(String(entry.value ?? ''));
            document.cookie = `${entry.name}=${value}; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/${secure}`;
        });
        window.dispatchEvent(new CustomEvent('legacy-upgrade-refresh'));
    }, profile.cookies);
}

async function seedV2State(page: Page, payload: V2State): Promise<void> {
    await page.goto('/');
    await waitForHydration(page);
    await page.evaluate((state) => {
        localStorage.setItem('gameState', JSON.stringify(state));
        localStorage.setItem('legacyV2Seeded', 'true');
        window.dispatchEvent(new CustomEvent('legacy-upgrade-refresh'));
    }, payload);
}

async function expectLegacyBanner(page: Page, visible: boolean): Promise<void> {
    await page.goto('/quests');
    await page.waitForLoadState('domcontentloaded');
    await waitForHydration(page);
    const banner = page.getByText('Legacy save detected — upgrade to v3 ASAP.');
    if (visible) {
        await expect(banner).toBeVisible();
    } else {
        await expect(banner).toHaveCount(0);
    }
}

async function expectV2Detected(page: Page, visible: boolean): Promise<void> {
    await goToSettings(page);
    const card = page.locator('.card:has(h3:has-text("V2 (localStorage saves)"))').first();
    if (visible) {
        await expect(card.getByText('Legacy v2 localStorage data detected')).toBeVisible();
    } else {
        await expect(card.getByText('No v2 localStorage data detected')).toBeVisible();
    }
}

async function clickChip(page: Page, name: string): Promise<void> {
    const button = page.getByRole('button', { name });
    await expect(button).toBeVisible();
    await button.click();
}

async function waitForStatusMessage(page: Page, pattern: RegExp): Promise<void> {
    await expect(page.getByText(pattern)).toBeVisible({ timeout: 20_000 });
}

async function createV3State(page: Page): Promise<void> {
    await page.goto('/quests');
    await waitForHydration(page);
    const candidate = page
        .locator(
            'a[href^="/quests/"]:not([href="/quests"]):not([href*="create"]):not([href*="manage"])'
        )
        .first();

    if ((await candidate.count()) > 0) {
        await candidate.click();
        await page.waitForLoadState('domcontentloaded');
        await waitForHydration(page);
    }

    await page.evaluate(() => {
        localStorage.setItem('remoteMigrationTouched', String(Date.now()));
    });
}

test.describe('Remote legacy migration matrix harness', () => {
    test.describe.configure({ mode: 'serial' });
    test.setTimeout(300_000);

    test.afterAll(async () => {
        if (!REPORT_FILE) {
            return;
        }

        const report = {
            generatedAt: new Date().toISOString(),
            baseURL: process.env.BASE_URL ?? null,
            checks: checkResults,
            manualResidue: MANUAL_RESIDUE,
            realV2SaveProvided: Boolean(realV2Save),
            realV2SaveLabel: realV2Save ? REAL_V2_SAVE_LABEL : null,
        };

        fs.mkdirSync(path.dirname(REPORT_FILE), { recursive: true });
        fs.writeFileSync(REPORT_FILE, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    });

    test('covers the remote-observable legacy migration matrix', async ({ page }) => {
        await runCheck(
            'A1',
            'clean environment starts without legacy banner or cards',
            async () => {
                await clearBrowserState(page);
                await expectLegacyBanner(page, false);
                await goToSettings(page);
                await expect(page.getByTestId('legacy-v1-cookie-summary')).toHaveText(
                    /No v1 cookie data detected/i
                );
                await expectV2Detected(page, false);
            }
        );

        await runCheck(
            'B1',
            'v1 detection works for minimal fixture and banner is visible',
            async () => {
                await clearBrowserState(page);
                await seedV1Profile(page, 'minimal');
                await expectLegacyBanner(page, true);
                await goToSettings(page);
                await expect(page.getByTestId('legacy-v1-cookie-summary')).toHaveText(/detected/i);
            }
        );

        await runCheck('B2', 'v1 merge action is available and reports success', async () => {
            await goToSettings(page);
            await clickChip(page, 'Merge v1 into current save');
            await waitForStatusMessage(page, /Merged v1 items into your current save/i);
        });

        await runCheck('B3', 'v1 replace action is available and reports success', async () => {
            await seedV1Profile(page, 'minimal');
            await goToSettings(page);
            await clickChip(page, 'Replace current save with v1');
            await waitForStatusMessage(page, /Replaced current save with converted v1 data/i);
        });

        await runCheck(
            'B4',
            'v1 cleanup via delete cookies clears banner and v1 detection card',
            async () => {
                await goToSettings(page);
                await clickChip(page, 'Delete v1 cookie data');
                await waitForStatusMessage(page, /Removed legacy v1 cookies/i);
                await page.reload();
                await waitForHydration(page);
                await expect(page.getByTestId('legacy-v1-cookie-summary')).toHaveText(
                    /No v1 cookie data detected/i
                );
                await expectLegacyBanner(page, false);
            }
        );

        await runCheck('C1', 'v2 detection works for built-in minimal fixture', async () => {
            await clearBrowserState(page);
            const minimal = v2Fixture.profiles?.minimal?.gameState;
            if (!minimal) {
                throw new Error('Missing built-in v2 minimal fixture.');
            }
            await seedV2State(page, minimal);
            await expectLegacyBanner(page, true);
            await expectV2Detected(page, true);
        });

        await runCheck('C2', 'v2 merge action runs and post-merge detection clears', async () => {
            await createV3State(page);
            await goToSettings(page);
            await clickChip(page, 'Merge v2 into current save');
            await page.waitForLoadState('domcontentloaded');
            await waitForHydration(page);
            await expectV2Detected(page, false);
        });

        await runCheck(
            'C3',
            'v2 replace action runs and post-replace detection clears',
            async () => {
                const inProgress = v2Fixture.profiles?.inProgress?.gameState;
                if (!inProgress) {
                    throw new Error('Missing built-in v2 inProgress fixture.');
                }
                await clearBrowserState(page);
                await seedV2State(page, inProgress);
                await goToSettings(page);
                await clickChip(page, 'Replace current save with v2');
                await page.waitForLoadState('domcontentloaded');
                await waitForHydration(page);
                await expectV2Detected(page, false);
            }
        );

        await runCheck(
            'C4',
            'manual cleanup control deletes v2 artifacts and clears banner',
            async () => {
                const messy = v2Fixture.profiles?.messy?.gameState;
                if (!messy) {
                    throw new Error('Missing built-in v2 messy fixture.');
                }
                await clearBrowserState(page);
                await seedV2State(page, messy);
                await goToSettings(page);
                await clickChip(page, 'Delete v2 localStorage data');
                await waitForStatusMessage(page, /Removed legacy v2 localStorage data/i);
                await page.reload();
                await waitForHydration(page);
                await expectV2Detected(page, false);
                await expectLegacyBanner(page, false);
            }
        );

        await runCheck(
            'C5',
            'real v2 save input (when provided) is detected and can be merged',
            async () => {
                if (!realV2Save) {
                    return;
                }
                await clearBrowserState(page);
                await seedV2State(page, realV2Save as V2State);
                await expectV2Detected(page, true);
                await clickChip(page, 'Merge v2 into current save');
                await page.waitForLoadState('domcontentloaded');
                await waitForHydration(page);
                await expectV2Detected(page, false);
            }
        );

        await runCheck(
            'D1',
            'malformed v2 JSON is surfaced as parse-warning and does not claim a detected save',
            async () => {
                await clearBrowserState(page);
                await page.goto('/settings');
                await waitForHydration(page);
                await page.evaluate(() => {
                    localStorage.setItem('gameState', '{"versionNumberString":"2.1"');
                    window.dispatchEvent(new CustomEvent('legacy-upgrade-refresh'));
                });
                await page.reload();
                await waitForHydration(page);
                await expect(page.getByText(/Legacy v2 data could not be parsed/i)).toBeVisible();
                await expectV2Detected(page, false);
            }
        );

        await runCheck(
            'D2',
            'missing-key v2-shaped payload is handled safely as non-detected legacy',
            async () => {
                await clearBrowserState(page);
                await seedV2State(page, { versionNumberString: '2.1' });
                await expectV2Detected(page, false);
            }
        );

        const failures = checkResults.filter((entry) => entry.status === 'fail');
        expect(
            failures.map((entry) => `${entry.id}: ${entry.error ?? entry.label}`),
            'One or more remote migration matrix checks failed. See report JSON for details.'
        ).toEqual([]);
    });
});
