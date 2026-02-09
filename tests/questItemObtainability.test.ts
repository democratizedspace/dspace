import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.join(__dirname, '..');
const questsDir = path.join(repoRoot, 'frontend', 'src', 'pages', 'quests', 'json');
const processesPath = path.join(
    repoRoot,
    'frontend',
    'src',
    'pages',
    'processes',
    'base.json'
);
const itemsDir = path.join(repoRoot, 'frontend', 'src', 'pages', 'inventory', 'json', 'items');

const loadJson = (filePath: string) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

const loadItems = () => {
    const items: Array<{
        id: string;
        name?: string;
        price?: string;
        priceExemptionReason?: string;
    }> = [];
    for (const entry of fs.readdirSync(itemsDir)) {
        if (!entry.endsWith('.json')) continue;
        const data = loadJson(path.join(itemsDir, entry));
        if (Array.isArray(data)) {
            items.push(...data);
        }
    }
    return items;
};

const walkQuests = (dir: string, quests: Array<Record<string, unknown>>) => {
    for (const entry of fs.readdirSync(dir)) {
        const fullPath = path.join(dir, entry);
        const stats = fs.statSync(fullPath);
        if (stats.isDirectory()) {
            walkQuests(fullPath, quests);
            continue;
        }
        if (!entry.endsWith('.json')) continue;
        quests.push(loadJson(fullPath));
    }
};

const getItemIds = (items?: Array<{ id?: string }>) =>
    Array.isArray(items) ? items.map((item) => item.id).filter(Boolean) : [];

const buildQuestRequirements = (quest: Record<string, unknown>) => {
    const nodes = new Map<string, { id: string; options?: Array<Record<string, unknown>> }>();
    const dialogue = Array.isArray(quest.dialogue) ? quest.dialogue : [];
    for (const node of dialogue) {
        if (node?.id) {
            nodes.set(
                node.id,
                node as { id: string; options?: Array<Record<string, unknown>> }
            );
        }
    }
    const startId = (quest.start as string) || 'start';
    const finishRequirements: Array<Set<string>> = [];
    const grantOptions: Array<{ requirements: Set<string>; items: string[] }> = [];
    const queue: Array<{ nodeId: string; requirements: Set<string> }> = [
        { nodeId: startId, requirements: new Set() },
    ];
    const visited = new Set<string>();

    while (queue.length > 0) {
        const current = queue.shift();
        if (!current) continue;
        const { nodeId, requirements } = current;
        const key = `${nodeId}|${Array.from(requirements).sort().join(',')}`;
        if (visited.has(key)) continue;
        visited.add(key);

        const node = nodes.get(nodeId);
        if (!node) continue;
        const options = Array.isArray(node.options) ? node.options : [];
        for (const option of options) {
            const optionRequires = getItemIds(option.requiresItems as Array<{ id?: string }>);
            const nextRequirements = new Set(requirements);
            for (const itemId of optionRequires) {
                nextRequirements.add(itemId);
            }

            if (option.type === 'finish') {
                finishRequirements.push(nextRequirements);
            }

            if (option.type === 'grantsItems') {
                const grantIds = getItemIds(option.grantsItems as Array<{ id?: string }>);
                if (grantIds.length > 0) {
                    grantOptions.push({ requirements: nextRequirements, items: grantIds });
                }
            }

            if (option.goto) {
                queue.push({ nodeId: option.goto as string, requirements: nextRequirements });
            }
        }
    }

    return { finishRequirements, grantOptions };
};

const isSubset = (subset: Set<string>, superset: Set<string>) =>
    Array.from(subset).every((item) => superset.has(item));

const getBestMissing = (requirements: Array<Set<string>>, obtainable: Set<string>) => {
    if (requirements.length === 0) return [] as string[];
    const missingSets = requirements.map((req) =>
        Array.from(req).filter((itemId) => !obtainable.has(itemId))
    );
    missingSets.sort((a, b) => a.length - b.length);
    return missingSets[0];
};

describe('quest item obtainability', () => {
    it('ensures quest-required items are obtainable', () => {
        const items = loadItems();
        const itemsById = new Map(items.map((item) => [item.id, item]));
        const catalogPurchasable = new Set(
            items
                .filter(
                    (item) =>
                        (typeof item.price === 'string' && item.price.trim().length > 0) ||
                        typeof item.priceExemptionReason === 'string'
                )
                .map((item) => item.id)
        );
        // Strict mode is used for welcome quests to ensure real purchase/process paths exist.
        const strictPurchasable = new Set(
            items
                .filter(
                    (item) => typeof item.price === 'string' && item.price.trim().length > 0
                )
                .map((item) => item.id)
        );

        const processes = loadJson(processesPath) as Array<Record<string, unknown>>;
        const quests: Array<Record<string, unknown>> = [];
        walkQuests(questsDir, quests);

        const questInfo = new Map(
            quests.map((quest) => {
                const requiresQuests = Array.isArray(quest.requiresQuests)
                    ? quest.requiresQuests
                    : [];
                const rewards = getItemIds(quest.rewards as Array<{ id?: string }>);
                const { finishRequirements, grantOptions } = buildQuestRequirements(quest);
                return [
                    quest.id as string,
                    { quest, requiresQuests, rewards, finishRequirements, grantOptions },
                ];
            })
        );

        const processOutputs = new Map<string, Array<{ id: string; requires: string[] }>>();
        for (const process of processes) {
            const created = getItemIds(process.createItems as Array<{ id?: string }>);
            const required = [
                ...getItemIds(process.requireItems as Array<{ id?: string }>),
                ...getItemIds(process.consumeItems as Array<{ id?: string }>),
            ];
            for (const itemId of created) {
                const list = processOutputs.get(itemId) ?? [];
                list.push({ id: process.id as string, requires: required });
                processOutputs.set(itemId, list);
            }
        }

        const questRewards = new Map<string, string[]>();
        const questGrants = new Map<string, string[]>();
        for (const info of questInfo.values()) {
            for (const itemId of info.rewards) {
                const list = questRewards.get(itemId) ?? [];
                list.push(info.quest.id as string);
                questRewards.set(itemId, list);
            }
            for (const grant of info.grantOptions) {
                for (const itemId of grant.items) {
                    const list = questGrants.get(itemId) ?? [];
                    list.push(info.quest.id as string);
                    questGrants.set(itemId, list);
                }
            }
        }

        const computeObtainable = (purchasable: Set<string>) => {
            const obtainable = new Set(purchasable);
            const completableQuests = new Set<string>();
            let changed = true;

            while (changed) {
                changed = false;

                for (const process of processes) {
                    const required = [
                        ...getItemIds(process.requireItems as Array<{ id?: string }>),
                        ...getItemIds(process.consumeItems as Array<{ id?: string }>),
                    ];
                    if (!required.every((itemId) => obtainable.has(itemId))) {
                        continue;
                    }
                    for (const itemId of getItemIds(
                        process.createItems as Array<{ id?: string }>
                    )) {
                        if (!obtainable.has(itemId)) {
                            obtainable.add(itemId);
                            changed = true;
                        }
                    }
                }

                for (const info of questInfo.values()) {
                    const prereqsMet = (info.requiresQuests as string[]).every((id) =>
                        completableQuests.has(id)
                    );
                    if (!prereqsMet) continue;

                    for (const grant of info.grantOptions) {
                        if (!isSubset(grant.requirements, obtainable)) continue;
                        for (const itemId of grant.items) {
                            if (!obtainable.has(itemId)) {
                                obtainable.add(itemId);
                                changed = true;
                            }
                        }
                    }

                    if (completableQuests.has(info.quest.id as string)) continue;
                    if (!info.finishRequirements.some((req) => isSubset(req, obtainable))) {
                        continue;
                    }

                    completableQuests.add(info.quest.id as string);
                    for (const itemId of info.rewards) {
                        if (!obtainable.has(itemId)) {
                            obtainable.add(itemId);
                            changed = true;
                        }
                    }
                }
            }

            return { obtainable, completableQuests };
        };

        const buildIssues = (obtainable: Set<string>, filter?: (id: string) => boolean) => {
            const issues: string[] = [];

            for (const info of questInfo.values()) {
                if (filter && !filter(info.quest.id as string)) continue;
                const finishRequirements = info.finishRequirements as Array<Set<string>>;
                if (finishRequirements.length === 0) continue;
                const missing = getBestMissing(finishRequirements, obtainable);
                if (missing.length === 0) continue;
                const knownMissing = missing.filter((itemId) => itemsById.has(itemId));
                // Unknown item ids are handled by separate quest validation tests.
                if (knownMissing.length === 0) continue;

                const missingDetails = knownMissing.map((itemId) => {
                    const item = itemsById.get(itemId) as
                        | { name?: string; price?: string }
                        | undefined;
                    const name = item?.name ?? 'Unknown item';
                    const reasons: string[] = [];

                    if (!item?.price) {
                        reasons.push('no price listed');
                    }

                    const processSources = processOutputs.get(itemId) ?? [];
                    if (processSources.length === 0) {
                        reasons.push('no producing process');
                    } else {
                        const processNotes = processSources.map((process) => {
                            const missingInputs = process.requires.filter(
                                (reqId) => !obtainable.has(reqId)
                            );
                            if (missingInputs.length === 0) {
                                return `${process.id} has obtainable inputs`;
                            }
                            const missingNames = missingInputs
                                .map((reqId) => itemsById.get(reqId)?.name ?? reqId)
                                .join(', ');
                            return `${process.id} requires ${missingNames}`;
                        });
                        reasons.push(`processes blocked: ${processNotes.join('; ')}`);
                    }

                    const questSources = new Set([
                        ...(questRewards.get(itemId) ?? []),
                        ...(questGrants.get(itemId) ?? []),
                    ]);
                    if (questSources.size === 0) {
                        reasons.push('no rewarding quest');
                    } else {
                        const questNotes = Array.from(questSources).map((questId) => {
                            const sourceInfo = questInfo.get(questId);
                            if (!sourceInfo) return questId;
                            const blocked = getBestMissing(
                                sourceInfo.finishRequirements as Array<Set<string>>,
                                obtainable
                            );
                            if (blocked.length === 0) {
                                return `${questId} is completable`;
                            }
                            const blockedNames = blocked
                                .map((reqId) => itemsById.get(reqId)?.name ?? reqId)
                                .join(', ');
                            return `${questId} missing ${blockedNames}`;
                        });
                        reasons.push(`quest rewards blocked: ${questNotes.join('; ')}`);
                    }

                    return `- ${name} (${itemId}): ${reasons.join('; ')}`;
                });

                issues.push(
                    `Quest ${info.quest.id} cannot be completed with obtainable items:\n${missingDetails.join(
                        '\n'
                    )}`
                );
            }

            return issues;
        };

        const catalogRun = computeObtainable(catalogPurchasable);
        const catalogIssues = buildIssues(catalogRun.obtainable);

        const strictRun = computeObtainable(strictPurchasable);
        const strictIssues = buildIssues(strictRun.obtainable, (id) => id.startsWith('welcome/'));

        expect(catalogIssues).toEqual([]);
        expect(strictIssues).toEqual([]);
    });
});
