const fs = require('fs');
const path = require('path');
const glob = require('glob');

const baselineFile = path.join(__dirname, '../baselines/contentCounts.json');
const baseline = JSON.parse(fs.readFileSync(baselineFile));
const questDir = path.join(__dirname, '../../frontend/src/pages/quests/json');
const itemsFile = path.join(__dirname, '../../frontend/src/pages/inventory/json/items.json');
const processesFile = path.join(__dirname, '../../frontend/src/pages/processes/processes.json');
const npcDir = path.join(__dirname, '../../frontend/public/assets/npc');

function getCounts() {
    const quests = glob.sync(path.join(questDir, '**/*.json')).length;
    const items = JSON.parse(fs.readFileSync(itemsFile)).length;
    const processes = JSON.parse(fs.readFileSync(processesFile)).length;
    const npcImages = fs.readdirSync(npcDir).filter(f => /\.(png|jpe?g|webp)$/.test(f)).length;
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
