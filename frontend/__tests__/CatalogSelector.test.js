import CatalogSelector from '../src/components/svelte/ui/CatalogSelector.svelte';

describe('CatalogSelector Component', () => {
    let container;

    const mockItems = [
        { id: 'item-1', name: 'Test Item 1', description: 'Description 1' },
        { id: 'item-2', name: 'Test Item 2', description: 'Description 2' },
    ];

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        if (container) {
            container.remove();
        }
    });

    test('emits select event on touchstart', () => {
        let selectedId = null;
        const component = new CatalogSelector({
            target: container,
            props: {
                items: mockItems,
                selectedId: '',
                label: 'Select Item',
            },
        });

        component.$on('select', (event) => {
            selectedId = event.detail.itemId;
        });

        const firstItem = container.querySelector('.item-option');
        firstItem.dispatchEvent(new Event('touchstart'));

        expect(selectedId).toBe('item-1');
    });

    test('expands the selector on edit button touchstart', async () => {
        new CatalogSelector({
            target: container,
            props: {
                items: mockItems,
                selectedId: 'item-2',
                label: 'Select Item',
            },
        });

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(container.querySelector('.items-list')).toBeFalsy();

        const editButton = container.querySelector('.edit-button');
        editButton.dispatchEvent(new Event('touchstart'));

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(container.querySelector('.items-list')).toBeTruthy();
    });
});
