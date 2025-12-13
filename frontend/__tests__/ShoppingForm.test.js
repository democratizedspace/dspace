const fs = require('fs');
const path = require('path');
const svelte = require('svelte/compiler');

describe('ShoppingForm component', () => {
    test('compiles without error', () => {
        const source = fs.readFileSync(
            path.join(__dirname, '../src/pages/shop/ShoppingForm.svelte'),
            'utf8'
        );
        expect(() => svelte.compile(source)).not.toThrow();
    });
});
