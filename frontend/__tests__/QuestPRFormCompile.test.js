/**
 * @jest-environment jsdom
 */
const fs = require('fs');
const path = require('path');
const svelte = require('svelte/compiler');

describe('QuestPRForm component', () => {
    test('compiles without error', () => {
        const source = fs.readFileSync(
            path.join(__dirname, '../src/components/svelte/QuestPRForm.svelte'),
            'utf8'
        );
        expect(() => svelte.compile(source)).not.toThrow();
    });
});
