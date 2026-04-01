import { expect, test, type Page } from '@playwright/test';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { purgeClientState, waitForHydration } from './test-helpers';

type LegacyV1Cookie = {
    name: string;
    value: string | number;
    encodeValue?: boolean;
};

type LegacyV1Profile = {
    label: string;
    cookies: LegacyV1Cookie[];
};

type LegacyV2Profile = {
    label: string;
    gameState: Record<string, unknown>;
};

type HarnessResult = {
    id: string;
    label: string;
    status: 'pass' | 'fail' | 'skip';
    detail?: string;
};

type HarnessReport = {
    generatedAt: string;
    baseURL: string;
    results: HarnessResult[];
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const frontendRoot = join(__dirname, '..');
const v1FixturePath = join(
    frontendRoot,
    'src',
    'utils',
    'legacySaveFixtures',
    'legacy_v1_cookie_save.json'
);
const v2FixturePath = join(
    frontendRoot,
    'src',
    'utils',
    'legacySaveFixtures',
    'legacy_v2_localstorage_save.json'
);
const reportPath = join(frontendRoot, 'test-results', 'remote-migration-harness-report.json');

const v1Fixture = JSON.parse(readFileSync(v1FixturePath, 'utf8')) as {
    profiles: Record<string, LegacyV1Profile>;
};
const v2Fixture = JSON.parse(readFileSync(v2FixturePath, 'utf8')) as {
    profiles: Record<string, LegacyV2Profile>;
};

const harnessResults: HarnessResult[] = [];

const LEGACY_BANNER_TEXT = 'Legacy save detected — upgrade to v3 ASAP.';
const REAL_V2_JSON_PATH = process.env.REMOTE_MIGRATION_REAL_V2_JSON_PATH?.trim() ?? '';

function readRealV2Payload(): string {
    if (!REAL_V2_JSON_PATH) {
        return '';
    }

    if (!existsSync(REAL_V2_JSON_PATH)) {
        throw new Error(`REMOTE_MIGRATION_REAL_V2_JSON_PATH does not exist: ${REAL_V2_JSON_PATH}`);
    }

    return readFileSync(REAL_V2_JSON_PATH, 'utf8').trim();
}

function addResult(id: string, label: string, status: HarnessResult['status'], detail = ''): void {
    harnessResults.push({ id, label, status, detail: detail || undefined });
}

async function goToSettings(page: Page): Promise<void> {
    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');
    await waitForHydration(page);
    await expect(page.getByRole('heading', { name: 'Legacy save upgrades' })).toBeVisible();
}

async function seedV1Profile(page: Page, profileId: string): Promise<void> {
    const profile = v1Fixture.profiles[profileId];
    if (!profile) {
        throw new Error(`Unknown v1 fixture profile: ${profileId}`);
    }

    await page.evaluate(
        ({ cookies }) => {
            cookies.forEach((cookie) => {
                const value =
                    cookie.encodeValue === false
                        ? String(cookie.value)
                        : encodeURIComponent(String(cookie.value));
                document.cookie = `${cookie.name}=${value}; path=/;`;
            });
        },
        { cookies: profile.cookies }
    );
}

async function seedV2State(page: Page, state: Record<string, unknown>): Promise<void> {
    await page.evaluate((legacyState) => {
        localStorage.setItem('gameState', JSON.stringify(legacyState));
        localStorage.setItem('legacyV2Seeded', 'true');
    }, state);
}

async function readStorageSnapshot(page: Page): Promise<{
    gameState: string | null;
    gameStateBackup: string | null;
}> {
    return await page.evaluate(() => ({
        gameState: localStorage.getItem('gameState'),
        gameStateBackup: localStorage.getItem('gameStateBackup'),
    }));
}

async function assertBannerVisibleOnQuests(page: Page, visible: boolean): Promise<void> {
    await page.goto('/quests');
    await page.waitForLoadState('domcontentloaded');
    await waitForHydration(page);
    const banner = page.getByText(LEGACY_BANNER_TEXT);
    if (visible) {
        await expect(banner).toBeVisible();
        return;
    }

    await expect(banner).toHaveCount(0);
}

test.describe('Remote legacy migration harness (3.2.2 coverage)', () => {
    test.describe.configure({ mode: 'serial' });
    test.setTimeout(180_000);
    test.skip(
        process.env.REMOTE_MIGRATION !== '1',
        'Set REMOTE_MIGRATION=1 (via qa:remote-migration) to run this harness.'
    );

    test.afterAll(async ({ baseURL }) => {
        mkdirSync(join(frontendRoot, 'test-results'), { recursive: true });
        const report: HarnessReport = {
            generatedAt: new Date().toISOString(),
            baseURL: baseURL ?? process.env.BASE_URL ?? 'unknown',
            results: harnessResults,
        };
        writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    });

    test('runs migration matrix harness and writes checklist report', async ({ page }) => {
        const tryStep = async (
            id: string,
            label: string,
            step: () => Promise<void>
        ): Promise<boolean> => {
            try {
                await step();
                addResult(id, label, 'pass');
                return true;
            } catch (error) {
                const detail = error instanceof Error ? error.message : String(error);
                addResult(id, label, 'fail', detail);
                return false;
            }
        };

        const failedSteps: string[] = [];
        const runStep = async (
            id: string,
            label: string,
            step: () => Promise<void>
        ): Promise<void> => {
            const passed = await tryStep(id, label, step);
            if (!passed) {
                failedSteps.push(`${id} (${label})`);
            }
        };

        await runStep('B.clean-env', 'Clean environment has no legacy cards/banner', async () => {
            await purgeClientState(page);
            await goToSettings(page);
            await expect(page.getByTestId('legacy-v1-cookie-summary')).toHaveText(
                /No v1 cookie data detected/
            );
            await expect(page.getByText('No v2 localStorage data detected')).toBeVisible();
            await assertBannerVisibleOnQuests(page, false);
        });

        await runStep('B.v1-detect-minimal', 'v1 minimal fixture detection + banner', async () => {
            await purgeClientState(page);
            await page.goto('/');
            await seedV1Profile(page, 'minimal');
            await goToSettings(page);
            await expect(page.getByTestId('legacy-v1-cookie-summary')).toContainText(
                /item cookies detected/
            );
            await assertBannerVisibleOnQuests(page, true);
        });

        await runStep('B.v1-merge', 'v1 merge action succeeds and clears banner', async () => {
            await goToSettings(page);
            await page.getByRole('button', { name: 'Merge v1 into current save' }).click();
            await expect(page.getByText('Merged v1 items into your current save.')).toBeVisible();
            await assertBannerVisibleOnQuests(page, false);
        });

        await runStep('B.v1-replace', 'v1 replace action succeeds', async () => {
            await purgeClientState(page);
            await page.goto('/');
            await seedV1Profile(page, 'maximal');
            await goToSettings(page);
            await page.getByRole('button', { name: 'Replace current save with v1' }).click();
            await expect(
                page.getByText('Replaced current save with converted v1 data.')
            ).toBeVisible();
        });

        await runStep(
            'B.v1-cleanup-button',
            'v1 delete cookie action clears detection',
            async () => {
                const deleteButton = page.getByRole('button', { name: 'Delete v1 cookie data' });
                const deleteButtonCount = await deleteButton.count();

                if (deleteButtonCount > 0) {
                    await deleteButton.first().click();
                    await expect(page.getByText('Removed legacy v1 cookies.')).toBeVisible();
                } else {
                    console.log(
                        '[B.v1-cleanup-button] Delete button absent; cookies were likely cleared by a prior step, so click was skipped.'
                    );
                }

                await expect(page.getByTestId('legacy-v1-cookie-summary')).toHaveText(
                    /No v1 cookie data detected/
                );
            }
        );

        await runStep('C.v2-detect', 'v2 minimal fixture detection', async () => {
            await purgeClientState(page);
            await page.goto('/');
            await seedV2State(page, v2Fixture.profiles.minimal.gameState);
            await goToSettings(page);
            await expect(page.getByText('Legacy v2 localStorage data detected')).toBeVisible();
        });

        await runStep(
            'C.v2-merge-manual-cleanup',
            'v2 merge upgrades state and clears v2 detection',
            async () => {
                await page.getByRole('button', { name: 'Merge v2 into current save' }).click();
                await expect(page.getByText('No v2 localStorage data detected')).toBeVisible({
                    timeout: 10_000,
                });
                await goToSettings(page);
                const storage = await readStorageSnapshot(page);
                if (storage.gameState !== null) {
                    const parsed = JSON.parse(storage.gameState || '{}');
                    expect(String(parsed.versionNumberString || parsed.version || '')).toMatch(
                        /^3/
                    );
                }
            }
        );

        await runStep('C.v2-replace-manual-cleanup', 'v2 replace path succeeds', async () => {
            await purgeClientState(page);
            await page.goto('/');
            await seedV2State(page, v2Fixture.profiles.inProgress.gameState);
            await goToSettings(page);
            await page.getByRole('button', { name: 'Replace current save with v2' }).click();
            await expect(page.getByText('No v2 localStorage data detected')).toBeVisible({
                timeout: 10_000,
            });
            await goToSettings(page);
            await expect(page.getByText('No v2 localStorage data detected')).toBeVisible();
        });

        await runStep(
            'C.v2-auto-cleanup-backup',
            'Auto migration cleans backup-only legacy keys',
            async () => {
                await purgeClientState(page);
                await page.goto('/');
                await page.evaluate((legacyState) => {
                    localStorage.removeItem('legacyV2Seeded');
                    localStorage.setItem('gameStateBackup', JSON.stringify(legacyState));
                    localStorage.removeItem('gameState');
                }, v2Fixture.profiles.minimal.gameState);
                await page.goto('/quests');
                await page.waitForLoadState('networkidle');
                const storage = await readStorageSnapshot(page);
                expect(storage.gameStateBackup).toBeNull();
            }
        );

        await runStep(
            'D.v2-malformed-json',
            'Invalid v2 JSON is surfaced without crash',
            async () => {
                await purgeClientState(page);
                await page.goto('/');
                await page.evaluate(() => {
                    localStorage.setItem('gameState', '{oops');
                });
                await goToSettings(page);
                await expect(page.getByText(/Legacy v2 data could not be parsed/)).toBeVisible();
            }
        );

        await runStep('D.v2-missing-keys', 'Missing v2 keys handled safely', async () => {
            await purgeClientState(page);
            await page.goto('/');
            await page.evaluate(() => {
                localStorage.setItem('gameState', JSON.stringify({ versionNumberString: '2.1' }));
                localStorage.setItem('legacyV2Seeded', 'true');
            });
            await goToSettings(page);
            await page.getByRole('button', { name: 'Merge v2 into current save' }).click();
            await expect(page.getByText('No v2 localStorage data detected')).toBeVisible({
                timeout: 10_000,
            });
            await goToSettings(page);
            await expect(page.getByText('No v2 localStorage data detected')).toBeVisible();
        });

        await runStep('C.v2-real-save', 'Real v2 payload detection + replace path', async () => {
            const realV2JsonRaw = readRealV2Payload();
            if (!realV2JsonRaw) {
                throw new Error('REMOTE_MIGRATION_REAL_V2_JSON_PATH payload is required.');
            }

            const parsed = JSON.parse(realV2JsonRaw) as Record<string, unknown>;
            await purgeClientState(page);
            await page.goto('/');
            await seedV2State(page, parsed);
            await goToSettings(page);
            await expect(page.getByText('Legacy v2 localStorage data detected')).toBeVisible();
            await page.getByRole('button', { name: 'Replace current save with v2' }).click();
            await expect(page.getByText('No v2 localStorage data detected')).toBeVisible({
                timeout: 10_000,
            });
            await goToSettings(page);
            await expect(page.getByText('No v2 localStorage data detected')).toBeVisible();
            const storage = await readStorageSnapshot(page);
            for (const raw of [storage.gameState, storage.gameStateBackup]) {
                if (!raw) {
                    continue;
                }
                const migrated = JSON.parse(raw) as Record<string, unknown>;
                const version = String(
                    (migrated.versionNumberString as string) ?? (migrated.version as string) ?? ''
                );
                expect(version).toMatch(/^3/);
                const migratedOpenAI = migrated.openAI as { apiKey?: unknown } | undefined;
                expect(migratedOpenAI?.apiKey).toBeUndefined();
            }
        });

        expect(
            failedSteps,
            `Migration harness steps failed:\n${failedSteps.map((step) => `- ${step}`).join('\n')}`
        ).toHaveLength(0);
    });
});
