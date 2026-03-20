import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import processes from '../src/generated/processes.json' assert { type: 'json' };
import capstoneQuest from '../src/pages/quests/json/completionist/award-iii.json' assert { type: 'json' };
import { purgeClientState, waitForHydration } from './test-helpers';

type HarnessResult = {
    id: string;
    label: string;
    status: 'pass' | 'fail' | 'skip';
    detail?: string;
};

type HarnessReport = {
    generatedAt: string;
    baseURL: string;
    automatedCoverage: string[];
    manualChecksRequired: string[];
    results: HarnessResult[];
};

type QuestStateRecord = Record<string, { finished: boolean; stepId?: string }>;
type InventoryRecord = Record<string, number>;

type ProcessDefinition = {
    id: string;
    requireItems?: Array<{ id: string; count: number }>;
    consumeItems?: Array<{ id: string; count: number }>;
    createItems?: Array<{ id: string; count: number }>;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const frontendRoot = join(__dirname, '..');
const reportPath = join(frontendRoot, 'test-results', 'remote-completionist-award-iii-harness-report.json');

const CAPSTONE_QUEST_ID = 'completionist/award-iii';
const CAPSTONE_ROUTE = '/quests/completionist/award-iii';
const AWARD_III_ITEM_ID = 'adf69f8d-4b30-4eec-b667-43ff5dfd9892';
const LEGACY_COMPLETIONIST_REWARD_ID = '1394c366-5078-49cf-b24e-c748e8428234';

const PROCESS_SEQUENCE = [
    'print-completionist-iii-modules',
    'mill-completionist-iii-wood-base',
    'solder-completionist-iii-harness',
    'integrate-completionist-iii-robotics',
    'assemble-completionist-iii-planter',
    'assemble-completionist-award-iii',
] as const;

const harnessResults: HarnessResult[] = [];

const automatedCoverage = [
    'Capstone is locked when Completionist Award III prerequisites are unmet.',
    'Capstone unlocks when all prerequisites are seeded complete.',
    'Each Award III process card is startable (then cancelable) when requirement inputs are seeded.',
    'Quest flow can advance through all capstone steps with deterministic seeded outputs.',
    'Finish path marks quest complete and keeps exactly one canonical Completionist Award III item.',
    'Quest finish grants only the legacy Completionist Award reward item once.',
];

const manualChecksRequired = [
    'Dialogue tone/content quality remains a manual human judgment call.',
    'Aesthetic/content presentation checks (voice fit, narrative polish, concept-image sufficiency) remain manual.',
];

function addResult(id: string, label: string, status: HarnessResult['status'], detail = ''): void {
    harnessResults.push({ id, label, status, detail: detail || undefined });
}

function getProcessById(processId: string): ProcessDefinition {
    const process = (processes as ProcessDefinition[]).find((entry) => entry.id === processId);
    if (!process) {
        throw new Error(`Missing process definition for ${processId}`);
    }
    return process;
}

function buildCapstoneSeedInventory(): InventoryRecord {
    const inventory: InventoryRecord = {
        [AWARD_III_ITEM_ID]: 0,
        [LEGACY_COMPLETIONIST_REWARD_ID]: 0,
    };

    for (const processId of PROCESS_SEQUENCE) {
        const process = getProcessById(processId);
        for (const item of [...(process.requireItems ?? []), ...(process.consumeItems ?? [])]) {
            const current = inventory[item.id] ?? 0;
            inventory[item.id] = Math.max(current, item.count + 1);
        }
    }

    return inventory;
}

function buildCompletedPrereqQuestState(): QuestStateRecord {
    const questState: QuestStateRecord = {};
    for (const requiredQuestId of capstoneQuest.requiresQuests ?? []) {
        questState[requiredQuestId] = { finished: true, stepId: 'finish' };
    }
    return questState;
}

async function seedGameState(page: Page, seed: {
    quests?: QuestStateRecord;
    inventory?: InventoryRecord;
}): Promise<void> {
    const statePayload = {
        quests: seed.quests ?? {},
        inventory: seed.inventory ?? {},
        processes: {},
        itemContainerCounts: {},
        settings: {},
        versionNumberString: '3',
        _meta: { lastUpdated: Date.now() },
    };

    await page.goto('/');
    await page.evaluate(async (state) => {
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
            const request = indexedDB.open('dspaceGameState');
            request.onupgradeneeded = () => {
                const upgradeDb = request.result;
                if (!upgradeDb.objectStoreNames.contains('state')) {
                    upgradeDb.createObjectStore('state');
                }
                if (!upgradeDb.objectStoreNames.contains('backup')) {
                    upgradeDb.createObjectStore('backup');
                }
                if (!upgradeDb.objectStoreNames.contains('meta')) {
                    upgradeDb.createObjectStore('meta');
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });

        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(['state', 'backup'], 'readwrite');
            tx.objectStore('state').put(state, 'root');
            tx.objectStore('backup').put(state, 'root');
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });

        localStorage.setItem('gameState', JSON.stringify(state));
        db.close();
    }, statePayload);
}

async function readInventoryCount(page: Page, itemId: string): Promise<number> {
    return page.evaluate(async (targetId) => {
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
            const request = indexedDB.open('dspaceGameState');
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });

        const state = await new Promise<
            Record<string, unknown> & { inventory?: Record<string, number> }
        >((resolve, reject) => {
            const tx = db.transaction('state', 'readonly');
            const request = tx.objectStore('state').get('root');
            request.onsuccess = () =>
                resolve(
                    ((request.result as Record<string, unknown>) ?? {}) as Record<
                        string,
                        unknown
                    > & {
                        inventory?: Record<string, number>;
                    }
                );
            request.onerror = () => reject(request.error);
        });

        db.close();
        return Number(state.inventory?.[targetId] ?? 0);
    }, itemId);
}

async function seedInventoryItem(page: Page, itemId: string, count: number): Promise<void> {
    await page.evaluate(
        async ({ targetId, targetCount }) => {
            const db = await new Promise<IDBDatabase>((resolve, reject) => {
                const request = indexedDB.open('dspaceGameState');
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });

            const state = await new Promise<
                Record<string, unknown> & {
                    inventory?: Record<string, number>;
                    _meta?: Record<string, unknown>;
                }
            >((resolve, reject) => {
                const tx = db.transaction('state', 'readonly');
                const request = tx.objectStore('state').get('root');
                request.onsuccess = () =>
                    resolve(
                        ((request.result as Record<string, unknown>) ?? {}) as Record<
                            string,
                            unknown
                        > & {
                            inventory?: Record<string, number>;
                            _meta?: Record<string, unknown>;
                        }
                    );
                request.onerror = () => reject(request.error);
            });

            state.inventory = state.inventory ?? {};
            state.inventory[targetId] = targetCount;
            state._meta = { ...(state._meta ?? {}), lastUpdated: Date.now() };

            await new Promise<void>((resolve, reject) => {
                const tx = db.transaction(['state', 'backup'], 'readwrite');
                tx.objectStore('state').put(state, 'root');
                tx.objectStore('backup').put(state, 'root');
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            });

            localStorage.setItem('gameState', JSON.stringify(state));
            db.close();
        },
        { targetId: itemId, targetCount: count }
    );
}

async function assertQuestLocked(page: Page): Promise<void> {
    await page.goto(CAPSTONE_ROUTE);
    await page.waitForLoadState('domcontentloaded');
    await waitForHydration(page);
    await expect(page.getByTestId('quest-unavailable')).toBeVisible();
    await expect(page.getByText('Quest not available yet')).toBeVisible();
    await expect(page.getByText('Locked', { exact: true })).toBeVisible();
}

async function assertQuestUnlocked(page: Page): Promise<void> {
    await page.goto(CAPSTONE_ROUTE);
    await page.waitForLoadState('domcontentloaded');
    await waitForHydration(page);
    await expect(page.getByTestId('quest-unavailable')).toHaveCount(0);
    await expect(
        page.getByText("You did it. Every current v3 quest is complete.", { exact: false })
    ).toBeVisible();
}

async function clickGotoByLabel(page: Page, label: string): Promise<void> {
    const button = page.getByRole('button', { name: label, exact: true });
    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();
    await button.click();
}

async function runProcessStartCancelCheck(page: Page): Promise<void> {
    for (const processId of PROCESS_SEQUENCE) {
        const process = getProcessById(processId);
        const card = page.locator('.container').filter({ has: page.locator('h3', { hasText: process.title }) }).first();

        await expect(card, `Expected process card for ${processId}`).toBeVisible();

        const startButton = card.getByTestId('process-start-button').first();
        await expect(startButton, `Expected ${processId} start button to be visible`).toBeVisible();
        await expect(startButton, `Expected ${processId} start button to be enabled`).toBeEnabled();
        await startButton.click();

        const cancelButton = card.getByRole('button', { name: 'Cancel' }).first();
        await expect(cancelButton, `Expected ${processId} to enter in-progress state`).toBeVisible();
        await cancelButton.click();
        await expect(startButton, `Expected ${processId} to return to startable state`).toBeVisible();
    }
}

async function walkQuestToFinish(page: Page): Promise<void> {
    await clickGotoByLabel(page, "I'm ready to build the Award III");

    const checkpoints = [
        { label: 'Printed modules are dimensionally accurate', itemId: 'be9cb892-f4b2-45fd-ae2b-34d3190acb59' },
        { label: 'Pedestal is flat, sealed, and mount-ready', itemId: 'fd54da0d-cf87-4860-bf74-df3be8a95f90' },
        { label: 'Harness passes continuity and polarity checks', itemId: '37f159f8-e8a2-4721-9608-c4b25855092e' },
        { label: 'Servo sweep is smooth and cable-safe', itemId: 'e6f5d8eb-1ce2-4a91-b9f4-3bbac465018b' },
        { label: 'Planter cup is stable and irrigated', itemId: 'ba8cc7ec-f6c9-429a-aa7d-4bf8f513f4c9' },
        { label: 'Award III is complete and fully validated', itemId: AWARD_III_ITEM_ID },
    ];

    for (const checkpoint of checkpoints) {
        await seedInventoryItem(page, checkpoint.itemId, 1);
        await clickGotoByLabel(page, checkpoint.label);
    }

    const finishButton = page.getByRole('button', {
        name: 'Claim the Completionist Award III',
        exact: true,
    });
    await expect(finishButton).toBeVisible();
    await expect(finishButton).toBeEnabled();
    await finishButton.click();

    await expect(page.getByText('Quest Complete!')).toBeVisible();
}

test.describe('Remote Completionist Award III harness (4.7 launch-gate automation)', () => {
    test.describe.configure({ mode: 'serial' });
    test.setTimeout(180_000);
    test.skip(
        process.env.REMOTE_COMPLETIONIST_AWARD_III !== '1',
        'Set REMOTE_COMPLETIONIST_AWARD_III=1 (via qa:remote-completionist-award-iii) to run this harness.'
    );

    test.afterAll(async ({ baseURL }) => {
        mkdirSync(join(frontendRoot, 'test-results'), { recursive: true });
        const report: HarnessReport = {
            generatedAt: new Date().toISOString(),
            baseURL: baseURL ?? process.env.BASE_URL ?? 'unknown',
            automatedCoverage,
            manualChecksRequired,
            results: harnessResults,
        };
        writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    });

    test('automates Completionist Award III capstone lock/unlock/process/reward flow', async ({ page }) => {
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

        const failures: string[] = [];
        const runStep = async (id: string, label: string, step: () => Promise<void>): Promise<void> => {
            const passed = await tryStep(id, label, step);
            if (!passed) {
                failures.push(`${id} (${label})`);
            }
        };

        const prerequisiteQuestState = buildCompletedPrereqQuestState();
        const seededInventory = buildCapstoneSeedInventory();

        await runStep('A.locked-pre-reqs', 'Capstone remains locked before prerequisites', async () => {
            await purgeClientState(page);
            await seedGameState(page, {
                quests: {},
                inventory: seededInventory,
            });
            await assertQuestLocked(page);
        });

        await runStep('B.unlock-after-seed', 'Capstone unlocks when prerequisites are seeded complete', async () => {
            await seedGameState(page, {
                quests: prerequisiteQuestState,
                inventory: seededInventory,
            });
            await assertQuestUnlocked(page);
        });

        await runStep(
            'C.process-chain-viable',
            'Each capstone process can start and cancel in sequence',
            async () => {
                await page.goto(CAPSTONE_ROUTE);
                await waitForHydration(page);
                await clickGotoByLabel(page, "I'm ready to build the Award III");
                await runProcessStartCancelCheck(page);
            }
        );

        await runStep(
            'D.exact-single-reward-and-finish',
            'Quest finish path yields exactly one Award III and a clean completion state',
            async () => {
                await seedGameState(page, {
                    quests: prerequisiteQuestState,
                    inventory: seededInventory,
                });
                await page.goto(CAPSTONE_ROUTE);
                await waitForHydration(page);

                const beforeAward = await readInventoryCount(page, AWARD_III_ITEM_ID);
                const beforeLegacyReward = await readInventoryCount(page, LEGACY_COMPLETIONIST_REWARD_ID);
                expect(beforeAward).toBe(0);

                await walkQuestToFinish(page);

                const afterAward = await readInventoryCount(page, AWARD_III_ITEM_ID);
                const afterLegacyReward = await readInventoryCount(page, LEGACY_COMPLETIONIST_REWARD_ID);
                expect(afterAward).toBe(1);
                expect(afterLegacyReward).toBe(beforeLegacyReward + 1);

                await page.goto(CAPSTONE_ROUTE);
                await waitForHydration(page);
                await expect(page.getByText('Quest Complete!')).toBeVisible();
            }
        );

        addResult('M.dialogue-tone', 'Dialogue tone and narrative quality require manual review', 'skip');
        addResult('M.aesthetic-content-review', 'Aesthetic/content judgement checks require human sign-off', 'skip');

        expect(
            failures,
            `Completionist harness steps failed:\n${failures.map((entry) => `- ${entry}`).join('\n')}`
        ).toHaveLength(0);
    });
});
