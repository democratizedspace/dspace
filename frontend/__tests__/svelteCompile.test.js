const fs = require('fs');
const path = require('path');
const svelte = require('svelte/compiler');

describe('Svelte component compilation', () => {
    const components = ['RemainingTime.svelte', 'ProgressBar.svelte'];
    components.forEach((file) => {
        test(`${file} compiles`, () => {
            const source = fs.readFileSync(
                path.join(__dirname, '../src/components/svelte', file),
                'utf8'
            );
            expect(() => svelte.compile(source)).not.toThrow();
        });
    });
});
