/**
 * @jest-environment jsdom
 */
const fs = require('fs');
const path = require('path');
const svelte = require('svelte/compiler');

describe('QuestForm component', () => {
    test('compiles without error', () => {
        const source = fs.readFileSync(
            path.join(__dirname, '../src/components/svelte/QuestForm.svelte'),
            'utf8'
        );
        expect(() => svelte.compile(source)).not.toThrow();
    });

    test('defines responsive item row layout for required items', () => {
        const source = fs.readFileSync(
            path.join(__dirname, '../src/components/svelte/QuestForm.svelte'),
            'utf8'
        );

        const desktopGridPattern =
            /grid-template-columns:\s*minmax\(240px, 1fr\)\s+minmax\(80px, 120px\)\s+auto;/;
        const mobileGridPattern =
            /@media\s*\(max-width:\s*640px\)[\s\S]*?\.item-row\s*{[\s\S]*?grid-template-columns:\s*1fr;/;

        expect(source).toMatch(desktopGridPattern);
        expect(source).toMatch(mobileGridPattern);
    });
});
