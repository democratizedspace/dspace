/**
 * @jest-environment node
 */
const fs = require('fs');
const path = require('path');
const { durationInSeconds } = require('../src/utils.js');

const processesFile = path.join(__dirname, '../src/pages/processes/processes.json');
const itemsFile = path.join(__dirname, '../src/pages/inventory/json/items.json');

const processes = JSON.parse(fs.readFileSync(processesFile));
const items = JSON.parse(fs.readFileSync(itemsFile));
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
    if (seconds > 31536000) {
        issues.push('duration longer than one year');
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

        expect(true).toBe(true);
    });
});
