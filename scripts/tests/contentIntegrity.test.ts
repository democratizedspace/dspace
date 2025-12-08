import { describe, expect, test } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const baselineFile = path.join(testDir, '../baselines/contentCounts.json');
const baseline = JSON.parse(fs.readFileSync(baselineFile, 'utf8'));
const questDir = path.join(testDir, '../../frontend/src/pages/quests/json');
const itemsDir = path.join(testDir, '../../frontend/src/pages/inventory/json/items');
const processesFile = path.join(testDir, '../../frontend/src/generated/processes.json');
const npcDir = path.join(testDir, '../../frontend/public/assets/npc');

function countFilesRecursively(dir: string, predicate: (file: string) => boolean) {
    return fs.readdirSync(dir, { withFileTypes: true }).reduce((total, entry) => {
        if (entry.isDirectory()) {
            return total + countFilesRecursively(path.join(dir, entry.name), predicate);
        }

        return predicate(entry.name) ? total + 1 : total;
    }, 0);
}

function getCounts() {
    const quests = countFilesRecursively(questDir, (name) => name.endsWith('.json'));
    const items = fs
        .readdirSync(itemsDir)
        .filter((name) => name.endsWith('.json'))
        .reduce((sum, file) => sum + JSON.parse(fs.readFileSync(path.join(itemsDir, file), 'utf8')).length, 0);
    const processes = JSON.parse(fs.readFileSync(processesFile, 'utf8')).length;
    const npcImages = fs
        .readdirSync(npcDir)
        .filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).length;
    return { quests, items, processes, npcImages };
}

describe('Content integrity counts', () => {
    const counts = getCounts();
    const update = process.env.UPDATE_BASELINE === 'true';

    test('counts meet or exceed baseline', () => {
        const failures = [];
        for (const key of Object.keys(baseline)) {
            if (counts[key] < baseline[key]) {
                failures.push(`${key}: ${counts[key]} < ${baseline[key]}`);
            }
        }

        if (update) {
            fs.writeFileSync(baselineFile, JSON.stringify(counts, null, 2));
            console.log('Baseline updated');
        }

        if (failures.length) {
            console.warn('Content count regressions:\n' + failures.join('\n'));
        }

        expect(failures.length).toBe(0);
    });
});
