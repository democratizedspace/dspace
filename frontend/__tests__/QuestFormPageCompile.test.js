/**
 * @jest-environment jsdom
 */
const fs = require('fs');
const path = require('path');
const svelte = require('svelte/compiler');

describe('QuestFormPage component', () => {
    test('compiles without error', () => {
        const source = fs.readFileSync(
            path.join(__dirname, '../src/components/svelte/QuestFormPage.svelte'),
            'utf8'
        );
        expect(() => svelte.compile(source)).not.toThrow();
    });
});
