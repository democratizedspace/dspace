const fs = require('fs');
const os = require('os');
const path = require('path');
const { parseArgs, createBundle } = require('../../scripts/create-content-bundle');

describe('create-content-bundle script', () => {
    test('parseArgs groups patterns correctly', () => {
        const args = [
            'q1.json',
            'q2.json',
            '--items',
            'item.json',
            '--processes',
            'proc1.json',
            'proc2.json',
        ];
        const parsed = parseArgs(args);
        expect(parsed.quests).toEqual(['q1.json', 'q2.json']);
        expect(parsed.items).toEqual(['item.json']);
        expect(parsed.processes).toEqual(['proc1.json', 'proc2.json']);
    });

    test('createBundle collects files and writes bundle', () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-test-'));
        const q = path.join(dir, 'quest.json');
        const i = path.join(dir, 'item.json');
        const p = path.join(dir, 'proc.json');
        fs.writeFileSync(q, JSON.stringify({ id: 1 }));
        fs.writeFileSync(i, JSON.stringify({ id: 2 }));
        fs.writeFileSync(p, JSON.stringify({ id: 3 }));
        const output = path.join(dir, 'bundle.json');

        const result = createBundle(output, { quests: [q], items: [i], processes: [p] });
        const data = JSON.parse(fs.readFileSync(output, 'utf8'));

        expect(result).toEqual(data);
        expect(data.quests[0].id).toBe(1);
        expect(data.items[0].id).toBe(2);
        expect(data.processes[0].id).toBe(3);
    });
});
