import { promises as fs } from 'node:fs';
import path from 'node:path';

const QUESTS_DIR = path.join(process.cwd(), 'frontend/src/pages/quests/json');
const OUTPUT_FILE = path.join(process.cwd(), 'docs/quest-tree.md');
const DEFAULT_ROOT = 'welcome/howtodoquests';

async function readJson(filePath) {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
}

async function walkQuestDir(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const quests = [];

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            quests.push(...(await walkQuestDir(fullPath)));
        } else if (entry.isFile() && entry.name.endsWith('.json')) {
            quests.push(await readJson(fullPath));
        }
    }

    return quests;
}

export async function loadQuests(baseDir = QUESTS_DIR) {
    const quests = await walkQuestDir(baseDir);
    return quests.sort((a, b) => a.id.localeCompare(b.id));
}

function groupQuests(quests) {
    return quests.reduce((acc, quest) => {
        const [group] = quest.id.split('/');
        if (!acc[group]) acc[group] = [];
        acc[group].push(quest);
        return acc;
    }, /** @type {Record<string, any[]>} */ ({}));
}

export function generateQuestTreeMarkdown(quests) {
    const groups = groupQuests(quests);
    const lines = [
        '# Quest Tree',
        '',
        'Auto-generated snapshot of quests, titles, descriptions, and prerequisites for tree sanity checks.',
        'Regenerate with `npm run gen:quest-tree`.',
        ''
    ];

    for (const group of Object.keys(groups).sort()) {
        lines.push(`## ${group}`);
        lines.push('| Quest | Title | Description | Requires |');
        lines.push('| --- | --- | --- | --- |');

        for (const quest of groups[group].sort((a, b) => a.id.localeCompare(b.id))) {
            const requires = quest.requiresQuests?.length
                ? quest.requiresQuests.join('<br>')
                : 'None';
            const description = (quest.description || '').replace(/\n/g, ' ');
            lines.push(`| ${quest.id} | ${quest.title ?? ''} | ${description} | ${requires} |`);
        }

        lines.push('');
    }

    return lines.join('\n');
}

export function validateQuestGraph(
    quests,
    { starterRoot = DEFAULT_ROOT, starterMaxDepth = 5 } = {}
) {
    const errors = [];
    const warnings = [];
    const questMap = new Map(quests.map((quest) => [quest.id, quest]));

    for (const quest of quests) {
        for (const requirement of quest.requiresQuests ?? []) {
            if (!questMap.has(requirement)) {
                errors.push(`Quest "${quest.id}" requires missing quest "${requirement}".`);
            }
        }
    }

    const visiting = new Set();
    const visited = new Set();
    const pathStack = [];

    function dfs(id) {
        if (visiting.has(id)) {
            const loopStart = pathStack.indexOf(id);
            const loopPath = [...pathStack.slice(loopStart), id];
            errors.push(`Cycle detected: ${loopPath.join(' -> ')}`);
            return;
        }

        if (visited.has(id)) return;

        visiting.add(id);
        pathStack.push(id);
        const quest = questMap.get(id);
        for (const requirement of quest?.requiresQuests ?? []) {
            dfs(requirement);
        }
        pathStack.pop();
        visiting.delete(id);
        visited.add(id);
    }

    for (const quest of quests) {
        dfs(quest.id);
    }

    const distanceCache = new Map();
    const distanceVisiting = new Set();

    function distance(id) {
        if (distanceCache.has(id)) return distanceCache.get(id);
        if (distanceVisiting.has(id)) return Infinity;

        const quest = questMap.get(id);
        if (!quest) return Infinity;
        if (id === starterRoot || !(quest.requiresQuests?.length)) {
            distanceCache.set(id, 0);
            return 0;
        }

        distanceVisiting.add(id);
        const prereqDistances = (quest.requiresQuests ?? []).map((req) => distance(req));
        distanceVisiting.delete(id);

        if (prereqDistances.some((value) => value === Infinity)) {
            distanceCache.set(id, Infinity);
            return Infinity;
        }

        const hops = Math.max(...prereqDistances) + 1;
        distanceCache.set(id, hops);
        return hops;
    }

    for (const quest of quests) {
        distance(quest.id);
    }

    const groupDistances = new Map();
    for (const quest of quests) {
        const group = quest.id.split('/')[0];
        const questDistance = distanceCache.get(quest.id) ?? Infinity;
        const current = groupDistances.get(group);
        if (current === undefined || questDistance < current) {
            groupDistances.set(group, questDistance);
        }
    }

    for (const [group, hops] of groupDistances.entries()) {
        if (hops === Infinity) {
            warnings.push(`No path from ${starterRoot} to any quest in group "${group}".`);
        } else if (hops > starterMaxDepth) {
            warnings.push(
                `Nearest quest in group "${group}" is ${hops} steps away from ${starterRoot}.`
            );
        }
    }

    return { errors, warnings, distances: distanceCache };
}

export async function writeQuestTree(outputPath = OUTPUT_FILE) {
    const quests = await loadQuests();
    const { errors, warnings } = validateQuestGraph(quests);

    if (errors.length) {
        const message = ['Quest validation failed:', ...errors].join('\n- ');
        throw new Error(message);
    }

    if (warnings.length) {
        console.warn('Quest validation warnings:\n- ' + warnings.join('\n- '));
    }

    const markdown = generateQuestTreeMarkdown(quests);
    await fs.writeFile(outputPath, markdown, 'utf8');
    return { outputPath, warnings };
}

if (import.meta.url === new URL(`file://${process.argv[1]}`).href) {
    writeQuestTree()
        .then(({ outputPath }) => {
            console.log(`Quest tree written to ${path.relative(process.cwd(), outputPath)}`);
        })
        .catch((error) => {
            console.error(error.message || error);
            process.exitCode = 1;
        });
}
