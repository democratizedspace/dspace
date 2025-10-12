/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/svelte';
import ItemPreview from '../src/components/svelte/ItemPreview.svelte';

describe('ItemPreview component', () => {
    it('renders item details', () => {
        const { getByText, getByAltText } = render(ItemPreview, {
            props: {
                name: 'Test Item',
                description: 'Useful for testing',
                imageUrl: '/item.png',
                price: '10',
                unit: 'kg',
                type: 'resource',
                dependencies: ['resource/filament', 'tool/nozzle'],
            },
        });

        getByText('Test Item');
        getByText('Useful for testing');
        getByText('Price: 10');
        getByText('Unit: kg');
        getByText('Type: resource');
        getByText('Dependencies:');
        getByText('resource/filament');
        getByText('tool/nozzle');
        const img = getByAltText('Item preview');
        expect(img.getAttribute('src')).toBe('/item.png');
    });
});
