/**
 * @jest-environment jsdom
 */
const fs = require('fs');
const path = require('path');
const svelte = require('svelte/compiler');

describe('ManageProcesses component', () => {
    it('compiles without error', () => {
        const source = fs.readFileSync(
            path.join(__dirname, '../src/pages/processes/svelte/ManageProcesses.svelte'),
            'utf8'
        );
        expect(() => svelte.compile(source)).not.toThrow();
    });
});
