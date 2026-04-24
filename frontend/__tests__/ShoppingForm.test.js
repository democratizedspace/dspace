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

    test('uses textContent for generated link labels', () => {
        const source = fs.readFileSync(
            path.join(__dirname, '../src/pages/shop/ShoppingForm.svelte'),
            'utf8'
        );

        expect(source).not.toContain('buyLink.innerHTML');
        expect(source).toContain('buyLink.textContent');
    });
});
