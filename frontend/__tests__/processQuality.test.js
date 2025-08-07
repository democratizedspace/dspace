/**
 * @jest-environment node
 */
const fs = require('fs');
const path = require('path');
const { durationInSeconds } = require('../src/utils.js');

const processesFile = path.join(__dirname, '../src/pages/processes/processes.json');
const itemsDir = path.join(__dirname, '../src/pages/inventory/json/items');

const processes = JSON.parse(fs.readFileSync(processesFile));
const items = fs
    .readdirSync(itemsDir)
    .filter((f) => f.endsWith('.json'))
    .flatMap((f) => JSON.parse(fs.readFileSync(path.join(itemsDir, f))));
const itemIds = new Set(items.map((i) => i.id));

function checkProcess(proc) {
    const issues = [];
    if (!proc.title || proc.title.trim().length < 3) {
        issues.push('missing or short title');
    }

    const seconds = durationInSeconds(proc.duration);
    if (!seconds || seconds <= 0) {
        issues.push(`invalid duration ${proc.duration}`);
    }
    if (seconds < 30) {
        issues.push('duration under 30s');
    }
    const max = 72 * 3600;
    if (seconds > max && !proc.long) {
        issues.push('duration longer than 72h');
    }

    const hasItems =
        (proc.requireItems && proc.requireItems.length > 0) ||
        (proc.consumeItems && proc.consumeItems.length > 0) ||
        (proc.createItems && proc.createItems.length > 0);

    if (!hasItems) {
        issues.push('no item relationships');
    }

    ['requireItems', 'consumeItems', 'createItems'].forEach((key) => {
        (proc[key] || []).forEach((entry) => {
            if (!itemIds.has(entry.id)) {
                issues.push(`unknown item ${entry.id} in ${key}`);
            }
        });
    });

    return issues;
}

describe('Process Quality Validation', () => {
    test('processes meet quality guidelines', () => {
        const issues = [];
        let validCount = 0;
        processes.forEach((proc) => {
            const procIssues = checkProcess(proc);
            if (procIssues.length === 0) {
                validCount++;
            } else {
                issues.push(`Process ${proc.id}: ${procIssues.join('; ')}`);
            }
        });

        const ratio = validCount / processes.length;
        console.log(`${Math.round(ratio * 100)}% processes meeting quality goal`);

        if (issues.length > 0) {
            console.warn('Process Quality Issues:');
            issues.forEach((i) => console.warn(`- ${i}`));
        }
        expect(issues.length).toBe(0);
    });

    test('duration sanity checks', () => {
        const shortProc = {
            id: 'short',
            title: 't',
            duration: '10s',
            requireItems: [{ id: items[0].id, count: 1 }],
        };
        const longProc = {
            id: 'long',
            title: 't',
            duration: '100h',
            long: true,
            requireItems: [{ id: items[0].id, count: 1 }],
        };
        expect(checkProcess(shortProc)).toContain('duration under 30s');
        expect(checkProcess(longProc)).not.toContain('duration longer than 72h');
    });

    test('semantic duration expectations', () => {
        const hints = [
            { pattern: /^(grow|regrow)/i, min: 7 * 24 * 3600 },
            { pattern: /^charge/i, min: 3600 },
        ];
        const issues = [];
        processes.forEach((proc) => {
            const seconds = durationInSeconds(proc.duration);
            const title = proc.title.toLowerCase();
            hints.forEach(({ pattern, min }) => {
                if (pattern.test(title) && seconds < min) {
                    issues.push(`${proc.id} duration ${proc.duration} unrealistically short`);
                }
            });
        });
        if (issues.length > 0) {
            console.warn('Semantic Duration Issues:');
            issues.forEach((i) => console.warn(`- ${i}`));
        }
        expect(issues.length).toBe(0);
    });
});
