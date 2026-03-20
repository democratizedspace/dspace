import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { flushGameStateWrites, purgeClientState, waitForHydration } from './test-helpers';

type QuestDefinition = {
    id: string;
    requiresQuests?: string[];
    rewards?: Array<{ id: string; count: number }>;
    dialogue?: Array<{
        id: string;
        options?: Array<{
            type?: string;
            goto?: string;
            requiresItems?: Array<{ id: string; count: number }>;
        }>;
    }>;
};

type ProcessDefinition = {
    id: string;
    requireItems?: Array<{ id: string; count: number }>;
    consumeItems?: Array<{ id: string; count: number }>;
    createItems?: Array<{ id: string; count: number }>;
};

type HarnessResult = {
    id: string;
    label: string;
    status: 'pass' | 'fail' | 'manual';
    detail?: string;
};

type GameStateLike = {
    versionNumberString?: string;
    inventory?: Record<string, number>;
    quests?: Record<string, { finished?: boolean; stepId?: string }>;
    processes?: Record<string, { startedAt?: number; duration?: number }>;
    settings?: Record<string, unknown>;
    [key: string]: unknown;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const frontendRoot = join(__dirname, '..');
const reportPath = join(
    frontendRoot,
    'test-results',
    'remote-completionist-award-iii-harness-report.json'
);
const awardQuestPath = join(
    frontendRoot,
    'src',
    'pages',
    'quests',
    'json',
    'completionist',
    'award-iii.json'
);
const processCatalogPath = join(frontendRoot, 'src', 'pages', 'processes', 'base.json');

const awardQuest = JSON.parse(readFileSync(awardQuestPath, 'utf8')) as QuestDefinition;
const processCatalog = JSON.parse(readFileSync(processCatalogPath, 'utf8')) as ProcessDefinition[];
const harnessResults: HarnessResult[] = [];

const PROCESS_CHAIN = [
    {
        processId: 'print-completionist-iii-modules',
        continueText: 'Printed modules are dimensionally accurate',
    },
    {
        processId: 'mill-completionist-iii-wood-base',
        continueText: 'Pedestal is flat, sealed, and mount-ready',
    },
    {
        processId: 'solder-completionist-iii-harness',
        continueText: 'Harness passes continuity and polarity checks',
    },
    {
        processId: 'integrate-completionist-iii-robotics',
        continueText: 'Servo sweep is smooth and cable-safe',
    },
    {
        processId: 'assemble-completionist-iii-planter',
        continueText: 'Planter cup is stable and irrigated',
    },
    {
        processId: 'assemble-completionist-award-iii',
        continueText: 'Award III is complete and fully validated',
    },
] as const;

const AUTOMATED_CHECK_LABELS = {
    locked: 'Quest remains locked before all prerequisites are complete',
    unlocked: 'Quest unlocks after all prerequisites are complete',
    processChain: 'Capstone process chain is startable and completable in sequence',
    rewardSingleton: 'Completionist Award III remains an exact single grant end-to-end',
    finishPath: 'Quest finish path remains clean after process chain completion',
} as const;

const MANUAL_ONLY_CHECKS: HarnessResult[] = [
    {
        id: 'M.dialogue-tone',
        label: 'Manual: dChat dialogue tone (congratulatory retrospective + future-facing)',
        status: 'manual',
        detail: 'Read intro and finish dialogue on the quest page; automation intentionally does not score tone.',
    },
    {
        id: 'M.content-judgment',
        label: 'Manual: aesthetic/content judgment for concept-image description quality',
        status: 'manual',
        detail: 'Human review required for visual fidelity and narrative quality judgments.',
    },
];

function addResult(result: HarnessResult): void {
    harnessResults.push(result);
}

function failResult(id: string, label: string, error: unknown): void {
    const detail = error instanceof Error ? error.message : String(error);
    addResult({ id, label, status: 'fail', detail });
}

function passResult(id: string, label: string, detail = ''): void {
    addResult({ id, label, status: 'pass', detail: detail || undefined });
}

function buildSeedInventory(): Record<string, number> {
    const aggregate = new Map<string, number>();
    const producedItemIds = new Set<string>();

    for (const processId of PROCESS_CHAIN.map((entry) => entry.processId)) {
        const process = processCatalog.find((candidate) => candidate.id === processId);
        if (!process) {
            throw new Error(`Missing process definition for ${processId}`);
        }

        for (const created of process.createItems ?? []) {
            producedItemIds.add(created.id);
        }
    }

    for (const processId of PROCESS_CHAIN.map((entry) => entry.processId)) {
        const process = processCatalog.find((candidate) => candidate.id === processId);
        if (!process) {
            throw new Error(`Missing process definition for ${processId}`);
        }

        for (const requirement of process.requireItems ?? []) {
            if (producedItemIds.has(requirement.id)) {
                continue;
            }

            const current = aggregate.get(requirement.id) ?? 0;
            aggregate.set(requirement.id, current + Number(requirement.count || 0));
        }

        for (const consumed of process.consumeItems ?? []) {
            if (producedItemIds.has(consumed.id)) {
                continue;
            }

            const current = aggregate.get(consumed.id) ?? 0;
            aggregate.set(consumed.id, current + Number(consumed.count || 0));
        }
    }

    return Object.fromEntries(Array.from(aggregate.entries()).map(([id, count]) => [id, count + 1]));
}

function deriveCanonicalRewardExpectation(): { builtAwardItemId: string; questRewardId: string; questRewardCount: number } {
    const finalAssemblyProcessId = PROCESS_CHAIN[PROCESS_CHAIN.length - 1]?.processId;
    if (!finalAssemblyProcessId) {
        throw new Error('PROCESS_CHAIN is empty; unable to derive final award process.');
    }

    const finalAssemblyProcess = processCatalog.find((candidate) => candidate.id === finalAssemblyProcessId);
    const builtAwardItemId = finalAssemblyProcess?.createItems?.[0]?.id;
    if (!builtAwardItemId) {
        throw new Error(
            `Cannot derive Completionist Award III item ID from process catalog (${finalAssemblyProcessId}.createItems[0].id).`
        );
    }

    const finalAssemblyDialogue = awardQuest.dialogue?.find((node) => node.id === 'final-assembly');
    const finishGateItemIds = new Set(
        (finalAssemblyDialogue?.options ?? [])
            .filter((option) => option.type === 'goto' && option.goto === 'finish')
            .flatMap((option) => option.requiresItems ?? [])
            .map((item) => item.id)
    );
    if (!finishGateItemIds.has(builtAwardItemId)) {
        throw new Error(
            `Quest finish gate does not require derived award item ${builtAwardItemId}; update completionist/award-iii canonical data.`
        );
    }

    const [questReward, ...extraRewards] = awardQuest.rewards ?? [];
    if (!questReward || extraRewards.length > 0) {
        throw new Error(
            'completionist/award-iii rewards must contain exactly one entry for deterministic remote harness assertions.'
        );
    }
    const questRewardCount = Number(questReward.count ?? 0);
    if (!Number.isFinite(questRewardCount) || questRewardCount <= 0) {
        throw new Error('completionist/award-iii reward count must be a positive number.');
    }

    return {
        builtAwardItemId,
        questRewardId: questReward.id,
        questRewardCount,
    };
}

async function writeGameState(page: Page, nextState: GameStateLike): Promise<void> {
    await page.goto('/');
    await page.evaluate(async (stateToWrite) => {
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
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });

        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(['state', 'backup'], 'readwrite');
            tx.objectStore('state').put(stateToWrite, 'root');
            tx.objectStore('backup').put(stateToWrite, 'root');
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });

        db.close();
    }, nextState);
}

async function readGameState(page: Page): Promise<GameStateLike> {
    await page.goto('/');
    return await page.evaluate(async () => {
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
            const request = indexedDB.open('dspaceGameState');
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });

        const state = await new Promise<GameStateLike>((resolve, reject) => {
            const tx = db.transaction('state', 'readonly');
            const request = tx.objectStore('state').get('root');
            request.onsuccess = () => resolve((request.result as GameStateLike) ?? {});
            request.onerror = () => reject(request.error);
        });

        db.close();
        return state;
    });
}

async function primeCapstoneState(
    page: Page,
    { omitPrerequisite = '', inventory = {} }: { omitPrerequisite?: string; inventory?: Record<string, number> }
): Promise<void> {
    const prerequisiteCompletions = Object.fromEntries(
        (awardQuest.requiresQuests ?? [])
            .filter((questId) => questId !== omitPrerequisite)
            .map((questId) => [questId, { finished: true }])
    );

    const seededState: GameStateLike = {
        versionNumberString: '3',
        inventory,
        quests: prerequisiteCompletions,
        processes: {},
        settings: {
            showQuestGraphVisualizer: true,
            showChatDebugPayload: true,
        },
    };

    await writeGameState(page, seededState);
}

async function openCapstoneQuest(page: Page): Promise<void> {
    await page.goto('/quests/completionist/award-iii');
    await page.waitForLoadState('domcontentloaded');
    await waitForHydration(page);
    await expect(page.getByRole('heading', { name: /Forge the Completionist Award III/i })).toBeVisible();
}

async function startAndCollectProcess(page: Page, processId: string): Promise<void> {
    const chatPanel = page.getByTestId('chat-panel');
    const startButton = chatPanel.getByTestId('process-start-button').first();

    await expect(startButton).toBeVisible();
    await startButton.click();
    await flushGameStateWrites(page);

    await page.evaluate(async (activeProcessId) => {
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
            const request = indexedDB.open('dspaceGameState');
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });

        const state = await new Promise<GameStateLike>((resolve, reject) => {
            const tx = db.transaction('state', 'readonly');
            const request = tx.objectStore('state').get('root');
            request.onsuccess = () => resolve((request.result as GameStateLike) ?? {});
            request.onerror = () => reject(request.error);
        });

        const processState = state.processes?.[activeProcessId];
        if (!processState || !Number.isFinite(processState.duration)) {
            throw new Error(`Unable to find active process state for ${activeProcessId}`);
        }

        const updatedState: GameStateLike = {
            ...state,
            processes: {
                ...(state.processes ?? {}),
                [activeProcessId]: {
                    ...processState,
                    startedAt: Date.now() - Number(processState.duration) - 2_000,
                },
            },
        };

        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(['state', 'backup'], 'readwrite');
            tx.objectStore('state').put(updatedState, 'root');
            tx.objectStore('backup').put(updatedState, 'root');
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });

        db.close();
    }, processId);

    await page.reload();
    await waitForHydration(page);

    const collectButton = chatPanel.getByRole('button', { name: 'Collect' }).first();
    await expect(collectButton).toBeVisible();
    await collectButton.click();
}

async function runStep(
    id: string,
    label: string,
    action: () => Promise<void>,
    failed: string[]
): Promise<void> {
    try {
        await action();
        passResult(id, label);
    } catch (error) {
        failResult(id, label, error);
        failed.push(id);
    }
}

test.describe('Remote Completionist Award III harness (4.7 launch-gate coverage)', () => {
    test.describe.configure({ mode: 'serial' });
    test.setTimeout(180_000);
    test.skip(
        process.env.REMOTE_COMPLETIONIST_AWARD_III !== '1',
        'Set REMOTE_COMPLETIONIST_AWARD_III=1 (via qa:remote-completionist-award-iii) to run this harness.'
    );

    test.afterAll(async ({ baseURL }) => {
        mkdirSync(join(frontendRoot, 'test-results'), { recursive: true });
        const resultById = new Map<string, HarnessResult>();
        for (const result of harnessResults) {
            resultById.set(result.id, result);
        }
        const dedupedResults = Array.from(resultById.values());

        const report = {
            generatedAt: new Date().toISOString(),
            baseURL: baseURL ?? process.env.BASE_URL ?? 'unknown',
            automatedChecks: AUTOMATED_CHECK_LABELS,
            manualChecks: MANUAL_ONLY_CHECKS,
            results: [...dedupedResults, ...MANUAL_ONLY_CHECKS],
        };
        writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    });

    test('validates Completionist Award III lock, process chain, and singleton reward', async ({ page }) => {
        const failedSteps: string[] = [];
        const prerequisites = awardQuest.requiresQuests ?? [];
        if (prerequisites.length === 0) {
            throw new Error('completionist/award-iii requiresQuests is empty; harness expects capstone prerequisites.');
        }

        const withheldPrerequisite = prerequisites[0];
        const canonicalReward = deriveCanonicalRewardExpectation();

        await runStep('A.locked', AUTOMATED_CHECK_LABELS.locked, async () => {
            await purgeClientState(page);
            await primeCapstoneState(page, { omitPrerequisite: withheldPrerequisite });
            await openCapstoneQuest(page);
            await expect(page.getByTestId('quest-unavailable')).toBeVisible();
            await expect(page.getByText('Quest not available yet')).toBeVisible();
        }, failedSteps);

        await runStep('B.unlocked', AUTOMATED_CHECK_LABELS.unlocked, async () => {
            const inventory = buildSeedInventory();
            await primeCapstoneState(page, { inventory });
            await openCapstoneQuest(page);
            await expect(page.getByTestId('quest-unavailable')).toHaveCount(0);
            await expect(page.getByRole('button', { name: "I'm ready to build the Award III" })).toBeVisible();
            await page.getByRole('button', { name: "I'm ready to build the Award III" }).click();
        }, failedSteps);

        await runStep('C.process-chain', AUTOMATED_CHECK_LABELS.processChain, async () => {
            for (const step of PROCESS_CHAIN) {
                await startAndCollectProcess(page, step.processId);
                await expect(page.getByRole('button', { name: step.continueText })).toBeVisible();
                await page.getByRole('button', { name: step.continueText }).click();
            }
        }, failedSteps);

        await runStep('D.reward-singleton', AUTOMATED_CHECK_LABELS.rewardSingleton, async () => {
            const beforeFinishState = await readGameState(page);
            const preFinishAwardCount = Number(beforeFinishState.inventory?.[canonicalReward.builtAwardItemId] ?? 0);
            expect(preFinishAwardCount).toBe(1);
            expect(Number(beforeFinishState.inventory?.[canonicalReward.questRewardId] ?? 0)).toBe(0);

            await openCapstoneQuest(page);
            await expect(page.getByRole('button', { name: 'Claim the Completionist Award III' })).toBeVisible();
            await page.getByRole('button', { name: 'Claim the Completionist Award III' }).click();

            const afterFinishState = await readGameState(page);
            const postFinishAwardCount = Number(afterFinishState.inventory?.[canonicalReward.builtAwardItemId] ?? 0);
            expect(postFinishAwardCount).toBe(1);
            expect(Number(afterFinishState.inventory?.[canonicalReward.questRewardId] ?? 0)).toBe(
                canonicalReward.questRewardCount
            );
        }, failedSteps);

        await runStep('E.finish-path', AUTOMATED_CHECK_LABELS.finishPath, async () => {
            await openCapstoneQuest(page);
            await expect(page.getByText('Quest Complete!')).toBeVisible();
        }, failedSteps);

        if (failedSteps.length > 0) {
            throw new Error(`Completionist Award III harness failed: ${failedSteps.join(', ')}`);
        }
    });
});
