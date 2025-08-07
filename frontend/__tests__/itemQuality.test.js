/**
 * @jest-environment node
 */
const fs = require('fs');
const path = require('path');

const itemsDir = path.join(__dirname, '../src/pages/inventory/json/items');
const publicDir = path.join(__dirname, '../public');

const items = fs
    .readdirSync(itemsDir)
    .filter((f) => f.endsWith('.json'))
    .flatMap((f) => JSON.parse(fs.readFileSync(path.join(itemsDir, f))));

function checkItem(item) {
    const issues = [];
    if (!item.name || item.name.trim().length < 3) {
        issues.push('missing or short name');
    }
    if (!item.description || item.description.trim().length < 10) {
        issues.push('missing or short description');
    }
    if (item.price) {
        const match = item.price.toString().match(/([0-9]+(\.[0-9]+)?)\s*dUSD/);
        if (!match) {
            issues.push('invalid price format');
        } else {
            const priceVal = parseFloat(match[1]);
            if (isNaN(priceVal) || priceVal <= 0 || priceVal > 100000) {
                issues.push(`price out of range (${item.price})`);
            }
        }
    }
    if (item.image) {
        const imagePath = path.join(publicDir, item.image.replace(/^\//, ''));
        if (!fs.existsSync(imagePath)) {
            issues.push(`missing image file ${item.image}`);
        }
    } else {
        issues.push('missing image');
    }
    return issues;
}

describe('Item Quality Validation', () => {
    test('items meet quality guidelines', () => {
        const issues = [];
        let validCount = 0;
        items.forEach((item) => {
            const itemIssues = checkItem(item);
            if (itemIssues.length === 0) {
                validCount++;
            } else {
                issues.push(`Item ${item.id}: ${itemIssues.join('; ')}`);
            }
        });

        const ratio = validCount / items.length;
        console.log(`${Math.round(ratio * 100)}% items meeting quality goal`);

        if (issues.length > 0) {
            console.warn('Item Quality Issues:');
            issues.forEach((i) => console.warn(`- ${i}`));
        }
        expect(issues.length).toBe(0);
    });
});
