const fs = require('fs');
const path = require('path');

describe('ShoppingForm component', () => {
    test('uses textContent for generated link labels', () => {
        const source = fs.readFileSync(
            path.join(__dirname, '../src/pages/shop/ShoppingForm.svelte'),
            'utf8'
        );

        expect(source).not.toContain('buyLink.innerHTML');
        expect(source).toContain('buyLink.textContent');
    });
});
