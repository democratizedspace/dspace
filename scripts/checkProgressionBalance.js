const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');

/**
 * Calculates the average dependency depth for each quest category and
 * returns the spread between the most and least deep categories.
 * @returns {number} The difference between max and min average depth.
 */
function checkProgressionBalance() {
    const questDir = path.join(__dirname, '../frontend/src/pages/quests/json');
    const quests = new Map();
    const questDependencies = new Map();
    const questsByCategory = new Map();

    const files = globSync(path.join(questDir, '**/*.json'));
    files.forEach((file) => {
        const data = JSON.parse(fs.readFileSync(file));
        quests.set(data.id, data);
        if (data.requiresQuests && data.requiresQuests.length > 0) {
            questDependencies.set(data.id, data.requiresQuests);
        }
        const category = data.id.split('/')[0];
        if (!questsByCategory.has(category)) {
            questsByCategory.set(category, []);
        }
        questsByCategory.get(category).push(data.id);
    });

    const depthCache = new Map();
    function getDepth(id) {
        if (depthCache.has(id)) return depthCache.get(id);
        const deps = questDependencies.get(id) || [];
        if (deps.length === 0) {
            depthCache.set(id, 0);
            return 0;
        }
        let max = 0;
        for (const d of deps) {
            if (quests.has(d)) {
                const dep = getDepth(d) + 1;
                if (dep > max) max = dep;
            }
        }
        depthCache.set(id, max);
        return max;
    }

    const averages = [];
    for (const ids of questsByCategory.values()) {
        const depths = ids.map((id) => getDepth(id));
        const avg = depths.reduce((a, b) => a + b, 0) / depths.length;
        averages.push(avg);
    }

    const maxAvg = Math.max(...averages);
    const minAvg = Math.min(...averages);
    return maxAvg - minAvg;
}

module.exports = { checkProgressionBalance };
