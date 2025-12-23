import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
    defaultHardening,
    normalizeHardening,
    evaluateQuestQuality,
    evaluateProcessQuality,
    writeJson,
    readJson,
    computeEmoji,
} from './utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..', '..');

const questDir = path.join(root, 'frontend/src/pages/quests/json');
const processBasePath = path.join(root, 'frontend/src/pages/processes/base.json');
const processHardeningDir = path.join(root, 'frontend/src/pages/processes/hardening');
const itemDir = path.join(root, 'frontend/src/pages/inventory/json/items');

function listQuestFiles(dir) {
    const files = [];
    for (const entry of fs.readdirSync(dir)) {
        const full = path.join(dir, entry);
        const stats = fs.statSync(full);
        if (stats.isDirectory()) {
            files.push(...listQuestFiles(full));
        } else if (entry.endsWith('.json')) {
            files.push(full);
        }
    }
    return files;
}

function normalizeQuest(filePath) {
    const quest = readJson(filePath);
    const baseline = evaluateQuestQuality(quest);
    quest.hardening = normalizeHardening(quest.hardening ?? defaultHardening, baseline);
    quest.hardening.emoji = computeEmoji(quest.hardening.passes, quest.hardening.score);
    writeJson(filePath, quest);
}

function normalizeItems() {
    let updated = 0;
    for (const entry of fs.readdirSync(itemDir)) {
        if (!entry.endsWith('.json')) continue;
        const filePath = path.join(itemDir, entry);
        const items = readJson(filePath);
        let changed = false;
        for (const item of items) {
            if (!item.hardening) continue;
            const normalized = normalizeHardening(item.hardening);
            normalized.emoji = computeEmoji(normalized.passes, normalized.score);
            if (JSON.stringify(item.hardening) !== JSON.stringify(normalized)) {
                item.hardening = normalized;
                changed = true;
            }
        }
        if (changed) {
            writeJson(filePath, items);
            updated += 1;
        }
    }
    return updated;
}

function normalizeProcesses() {
    const processes = readJson(processBasePath);
    let changed = false;
    const processMap = new Map(processes.map((proc) => [proc.id, proc]));

    for (const proc of processes) {
        const baseline = evaluateProcessQuality(proc);
        const normalized = normalizeHardening(proc.hardening ?? defaultHardening, baseline);
        normalized.emoji = computeEmoji(normalized.passes, normalized.score);
        if (JSON.stringify(proc.hardening) !== JSON.stringify(normalized)) {
            proc.hardening = normalized;
            changed = true;
        }
    }

    if (changed) {
        writeJson(processBasePath, processes);
    }

    if (!fs.existsSync(processHardeningDir)) return { changed, hardeningFiles: 0 };

    let hardeningFiles = 0;
    for (const entry of fs.readdirSync(processHardeningDir)) {
        if (!entry.endsWith('.json')) continue;
        const filePath = path.join(processHardeningDir, entry);
        const data = readJson(filePath);
        const id = entry.replace(/\.json$/, '');
        const baseline = processMap.has(id) ? evaluateProcessQuality(processMap.get(id)) : 0;
        const normalized = normalizeHardening(data ?? defaultHardening, baseline);
        normalized.emoji = computeEmoji(normalized.passes, normalized.score);
        writeJson(filePath, normalized);
        hardeningFiles += 1;
    }

    return { changed, hardeningFiles };
}

function main() {
    const questFiles = listQuestFiles(questDir);
    questFiles.forEach(normalizeQuest);
    const itemUpdates = normalizeItems();
    const { changed: processChanged, hardeningFiles } = normalizeProcesses();

    console.log(`Normalized ${questFiles.length} quests.`);
    console.log(`Normalized ${hardeningFiles} process hardening files.`);
    console.log(`Updated process base: ${processChanged ? 'yes' : 'no changes needed'}`);
    console.log(`Item files adjusted: ${itemUpdates}`);
}

main();
