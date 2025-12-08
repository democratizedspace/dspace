import { describe, expect, test } from 'vitest';
import fs from 'fs';
import path from 'path';

const baselineFile = path.join(__dirname, '../baselines/contentCounts.json');
const baseline = JSON.parse(fs.readFileSync(baselineFile, 'utf8'));
const questDir = path.join(__dirname, '../../frontend/src/pages/quests/json');
const itemsDir = path.join(__dirname, '../../frontend/src/pages/inventory/json/items');
const processesFile = path.join(__dirname, '../../frontend/src/generated/processes.json');
const npcDir = path.join(__dirname, '../../frontend/public/assets/npc');

function countJsonFiles(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).reduce((total, entry) => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            return total + countJsonFiles(fullPath);
        }

        return total + (entry.isFile() && entry.name.endsWith('.json') ? 1 : 0);
    }, 0);
}

function countItems(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).reduce((total, entry) => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            return total + countItems(fullPath);
        }

        if (entry.isFile() && entry.name.endsWith('.json')) {
            const items = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
            return total + (Array.isArray(items) ? items.length : 0);
        }

        return total;
    }, 0);
}

function getCounts() {
    const quests = countJsonFiles(questDir);
    const items = countItems(itemsDir);
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
