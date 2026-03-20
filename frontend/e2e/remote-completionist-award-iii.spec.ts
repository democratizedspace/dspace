import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import items from '../src/pages/inventory/json/items';
import processes from '../src/generated/processes.json';
import awardIIIQuest from '../src/pages/quests/json/completionist/award-iii.json';
import { purgeClientState, waitForHydration } from './test-helpers';

type QuestProgress = {
    finished?: boolean;
    stepId?: string;
    itemsClaimed?: string[];
};

type GameState = {
    quests: Record<string, QuestProgress>;
    inventory: Record<string, number>;
    processes: Record<string, unknown>;
    itemContainerCounts: Record<string, number>;
    settings: Record<string, unknown>;
    versionNumberString: string;
    _meta: {
        lastUpdated: number;
        checksum: string;
    };
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
    manualChecks: string[];
    results: HarnessResult[];
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const frontendRoot = join(__dirname, '..');
const reportPath = join(
    frontendRoot,
    'test-results',
    'remote-completionist-award-iii-harness-report.json'
);

const harnessResults: HarnessResult[] = [];

const MANUAL_CHECKS = [
    'Dialogue tone/content judgment: confirm congratulatory retrospective + future-facing voice.',
    'Aesthetic/content quality check: verify narrative polish and imagery suitability for release notes.',
];

const QUEST_ID = awardIIIQuest.id;
const PREREQ_QUEST_IDS = awardIIIQuest.requiresQuests;
const PROCESS_IDS = awardIIIQuest.dialogue
    .flatMap((step) => step.options)
    .filter((option) => option.type === 'process')
    .map((option) => String(option.process));
const GOTO_GATE_ITEM_IDS = awardIIIQuest.dialogue
    .flatMap((step) => step.options)
    .filter((option) => option.type === 'goto')
    .flatMap((option) => option.requiresItems ?? [])
    .map((item) => String(item.id));
const FINAL_AWARD_III_ITEM_ID = GOTO_GATE_ITEM_IDS[GOTO_GATE_ITEM_IDS.length - 1];
const REWARD_ITEM_ID = String(awardIIIQuest.rewards[0]?.id ?? '');
const REWARD_ITEM_COUNT = Number(awardIIIQuest.rewards[0]?.count ?? 0);

const PROCESS_INPUT_ITEM_COUNTS = new Map<string, number>();
for (const processId of PROCESS_IDS) {
    const process = (processes as Array<Record<string, unknown>>).find(
        (entry) => entry.id === processId
    );
    if (!process) {
        continue;
    }

    const allInputs = [
        ...(Array.isArray(process.requireItems) ? process.requireItems : []),
        ...(Array.isArray(process.consumeItems) ? process.consumeItems : []),
    ] as Array<{ id?: string; count?: number }>;

    for (const item of allInputs) {
        const itemId = String(item.id ?? '').trim();
        const count = Number(item.count ?? 0);
        if (!itemId || !Number.isFinite(count) || count <= 0) {
            continue;
        }

        const scaled = Math.max(1, Math.ceil(count * 2));
        PROCESS_INPUT_ITEM_COUNTS.set(
            itemId,
            Math.max(PROCESS_INPUT_ITEM_COUNTS.get(itemId) ?? 0, scaled)
        );
    }
}

for (const gateItemId of GOTO_GATE_ITEM_IDS) {
    PROCESS_INPUT_ITEM_COUNTS.set(
        gateItemId,
        Math.max(PROCESS_INPUT_ITEM_COUNTS.get(gateItemId) ?? 0, 1)
    );
}

function addResult(id: string, label: string, status: HarnessResult['status'], detail = ''): void {
    harnessResults.push({ id, label, status, detail: detail || undefined });
}

async function seedState(page: Page, state: GameState): Promise<void> {
    await page.evaluate(async (statePayload) => {
        const stateClone = structuredClone(statePayload);
        localStorage.setItem('gameState', JSON.stringify(stateClone));
        localStorage.removeItem('gameStateBackup');

        await new Promise<void>((resolve, reject) => {
            const openRequest = indexedDB.open('dspaceGameState', 2);
            openRequest.onupgradeneeded = () => {
                const db = openRequest.result;
                if (!db.objectStoreNames.contains('state')) {
                    db.createObjectStore('state');
                }
                if (!db.objectStoreNames.contains('backup')) {
                    db.createObjectStore('backup');
                }
                if (!db.objectStoreNames.contains('meta')) {
                    db.createObjectStore('meta');
                }
            };
            openRequest.onerror = () => reject(openRequest.error);
            openRequest.onsuccess = () => {
                const db = openRequest.result;
                const tx = db.transaction(['state', 'meta', 'backup'], 'readwrite');
                tx.objectStore('state').put(stateClone, 'root');
                tx.objectStore('meta').put(
                    {
                        checksum: stateClone?._meta?.checksum ?? 'seeded',
                        dUSD: Number(
                            stateClone?.inventory?.['5247a603-294a-4a34-a884-1ae20969b2a1'] ?? 0
                        ),
                        lastUpdated: Number(stateClone?._meta?.lastUpdated ?? Date.now()),
                    },
                    'root'
                );
                tx.objectStore('backup').clear();
                tx.onerror = () => {
                    db.close();
                    reject(tx.error);
                };
                tx.oncomplete = () => {
                    db.close();
                    resolve();
                };
            };
        });
    }, state);
}

function buildState({
    completePrereqs,
    inventory,
}: {
    completePrereqs: boolean;
    inventory: Record<string, number>;
}): GameState {
    const quests: Record<string, QuestProgress> = {};
    if (completePrereqs) {
        for (const questId of PREREQ_QUEST_IDS) {
            quests[questId] = { finished: true };
        }
    }

    return {
        quests,
        inventory,
        processes: {},
        itemContainerCounts: {},
        settings: {},
        versionNumberString: '3',
        _meta: {
            lastUpdated: Date.now(),
            checksum: `qa-${Date.now()}`,
        },
    };
}

async function openQuest(page: Page): Promise<void> {
    await page.goto(`/quests/${QUEST_ID}`);
    await page.waitForLoadState('domcontentloaded');
    await waitForHydration(page);
    await expect(page.getByTestId('chat-panel')).toBeVisible();
}

async function readInventoryCounts(page: Page, itemIds: string[]): Promise<Record<string, number>> {
    return page.evaluate((ids) => {
        const parsed = JSON.parse(localStorage.getItem('gameState') ?? '{}') as {
            inventory?: Record<string, unknown>;
        };
        const inventory = parsed?.inventory ?? {};
        return ids.reduce<Record<string, number>>((acc, id) => {
            const raw = Number(inventory[id] ?? 0);
            acc[id] = Number.isFinite(raw) ? raw : 0;
            return acc;
        }, {});
    }, itemIds);
}

test.describe('Remote Completionist Award III harness (4.7 coverage)', () => {
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
            manualChecks: MANUAL_CHECKS,
            results: harnessResults,
        };
        writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    });

    test('validates capstone lock-state, process viability, and single-reward finish flow', async ({
        page,
    }) => {
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

        await runStep('A.quest-data', 'Quest/process/reward references resolve', async () => {
            expect(PREREQ_QUEST_IDS.length).toBeGreaterThan(0);
            expect(PROCESS_IDS.length).toBe(6);
            expect(GOTO_GATE_ITEM_IDS.length).toBe(6);
            expect(REWARD_ITEM_ID).toBeTruthy();
            expect(REWARD_ITEM_COUNT).toBeGreaterThan(0);
            expect(FINAL_AWARD_III_ITEM_ID).toBeTruthy();

            for (const itemId of [REWARD_ITEM_ID, FINAL_AWARD_III_ITEM_ID]) {
                const found = items.find((entry) => entry.id === itemId);
                expect(Boolean(found), `Expected item ${itemId} in inventory catalog`).toBeTruthy();
            }

            for (const processId of PROCESS_IDS) {
                const found = (processes as Array<{ id?: string }>).some(
                    (entry) => entry.id === processId
                );
                expect(
                    Boolean(found),
                    `Expected process ${processId} in process catalog`
                ).toBeTruthy();
            }
        });

        await runStep(
            'B.locked-before-prereqs',
            'Quest remains locked before prerequisites',
            async () => {
                await purgeClientState(page);
                await openQuest(page);
                await seedState(
                    page,
                    buildState({
                        completePrereqs: false,
                        inventory: {},
                    })
                );
                await openQuest(page);
                await expect(page.getByTestId('quest-unavailable')).toBeVisible();
                await expect(page.getByText('Quest not available yet')).toBeVisible();
            }
        );

        await runStep(
            'C.unlocked-after-prereqs',
            'Quest unlocks when prerequisite quests are complete',
            async () => {
                const seededInventory = Object.fromEntries(PROCESS_INPUT_ITEM_COUNTS.entries());
                await seedState(
                    page,
                    buildState({
                        completePrereqs: true,
                        inventory: seededInventory,
                    })
                );
                await openQuest(page);
                await expect(page.getByTestId('quest-unavailable')).toHaveCount(0);
                await expect(page.getByText("I'm ready to build the Award III")).toBeVisible();
            }
        );

        await runStep(
            'D.process-chain-viability',
            'Every capstone process can start and cleanly cancel',
            async () => {
                for (const processId of PROCESS_IDS) {
                    const processCard = page.locator(`[data-process-id="${processId}"]`).first();
                    await expect(
                        processCard,
                        `Expected process card for ${processId}`
                    ).toBeVisible();

                    const startButton = processCard.getByTestId('process-start-button').first();
                    await expect(
                        startButton,
                        `Expected start button for ${processId}`
                    ).toBeVisible();
                    await startButton.click();

                    const cancelButton = processCard
                        .getByRole('button', { name: 'Cancel' })
                        .first();
                    await expect(
                        cancelButton,
                        `Expected active state for ${processId}`
                    ).toBeVisible();
                    await cancelButton.click();

                    await expect(
                        startButton,
                        `Expected reset state after cancel for ${processId}`
                    ).toBeVisible();
                }
            }
        );

        await runStep(
            'E.single-reward-clean-finish',
            'Finish path grants exactly one legacy reward and does not duplicate Award III',
            async () => {
                const finishPathInventory = Object.fromEntries(
                    GOTO_GATE_ITEM_IDS.map((itemId) => [itemId, 1])
                );
                finishPathInventory[REWARD_ITEM_ID] = 0;
                finishPathInventory[FINAL_AWARD_III_ITEM_ID] = 1;

                await seedState(
                    page,
                    buildState({
                        completePrereqs: true,
                        inventory: finishPathInventory,
                    })
                );

                await openQuest(page);

                await page
                    .getByRole('button', { name: "I'm ready to build the Award III" })
                    .click();
                await page
                    .getByRole('button', { name: 'Printed modules are dimensionally accurate' })
                    .click();
                await page
                    .getByRole('button', { name: 'Pedestal is flat, sealed, and mount-ready' })
                    .click();
                await page
                    .getByRole('button', { name: 'Harness passes continuity and polarity checks' })
                    .click();
                await page
                    .getByRole('button', { name: 'Servo sweep is smooth and cable-safe' })
                    .click();
                await page
                    .getByRole('button', { name: 'Planter cup is stable and irrigated' })
                    .click();
                await page
                    .getByRole('button', { name: 'Award III is complete and fully validated' })
                    .click();

                const beforeFinish = await readInventoryCounts(page, [
                    REWARD_ITEM_ID,
                    FINAL_AWARD_III_ITEM_ID,
                ]);
                await page
                    .getByRole('button', { name: 'Claim the Completionist Award III' })
                    .click();
                await expect(page.getByText('Quest Complete!')).toBeVisible();

                const afterFinish = await readInventoryCounts(page, [
                    REWARD_ITEM_ID,
                    FINAL_AWARD_III_ITEM_ID,
                ]);
                expect(afterFinish[REWARD_ITEM_ID]).toBe(
                    beforeFinish[REWARD_ITEM_ID] + REWARD_ITEM_COUNT
                );
                expect(afterFinish[FINAL_AWARD_III_ITEM_ID]).toBe(
                    beforeFinish[FINAL_AWARD_III_ITEM_ID]
                );
            }
        );

        if (failedSteps.length > 0) {
            throw new Error(`Completionist harness failures: ${failedSteps.join(', ')}`);
        }
    });
});
