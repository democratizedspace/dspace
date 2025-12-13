const fs = require('fs');
const path = require('path');
const svelte = require('svelte/compiler');

describe('CompactItemList.svelte compilation', () => {
    it('compiles without error', () => {
        const source = fs.readFileSync(
            path.join(__dirname, '../src/components/svelte/ui/CompactItemList.svelte'),
            'utf8'
        );
        expect(() => svelte.compile(source, {})).not.toThrow();
    });
});
