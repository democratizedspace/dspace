import ItemSelector from '../src/components/svelte/ItemSelector.svelte';

describe('ItemSelector Component', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        if (container) {
            container.remove();
        }
    });

    const mockItems = [
        { id: 'item-1', name: 'Test Item 1', description: 'Description 1' },
        { id: 'item-2', name: 'Test Item 2', description: 'Description 2' },
        { id: 'item-3', name: 'Another Item', description: 'Description 3' },
    ];

    test('should mount component', () => {
        const component = new ItemSelector({
            target: container,
            props: {
                items: mockItems,
                selectedItemId: '',
                label: 'Select Item',
            },
        });

        expect(component).toBeTruthy();
        expect(container.querySelector('.item-selector')).toBeTruthy();
    });

    test('should filter items based on search input', async () => {
        const component = new ItemSelector({
            target: container,
            props: {
                items: mockItems,
                selectedItemId: '',
                label: 'Select Item',
            },
        });

        const searchInput = container.querySelector('input[type="text"]');
        searchInput.value = 'Another';
        searchInput.dispatchEvent(new Event('input'));

        // Wait for Svelte to update
        await new Promise((resolve) => setTimeout(resolve, 0));

        const visibleItems = container.querySelectorAll('.item-row');
        expect(visibleItems.length).toBe(1);
        expect(visibleItems[0].textContent).toContain('Another Item');
    });

    test('should emit select event when item is selected', () => {
        let selectedId = null;
        const component = new ItemSelector({
            target: container,
            props: {
                items: mockItems,
                selectedItemId: '',
                label: 'Select Item',
            },
        });

        component.$on('select', (event) => {
            selectedId = event.detail.itemId;
        });

        // Find and click the first item
        const firstItem = container.querySelector('.item-row');
        firstItem.click();

        expect(selectedId).toBe('item-1');
    });

    test('should emit select event on touch', () => {
        let selectedId = null;
        const component = new ItemSelector({
            target: container,
            props: {
                items: mockItems,
                selectedItemId: '',
                label: 'Select Item',
            },
        });

        component.$on('select', (event) => {
            selectedId = event.detail.itemId;
        });

        const firstItem = container.querySelector('.item-row');
        firstItem.dispatchEvent(new Event('touchstart'));

        expect(selectedId).toBe('item-1');
    });

    test('should show selected item when selectedItemId is provided', () => {
        const component = new ItemSelector({
            target: container,
            props: {
                items: mockItems,
                selectedItemId: 'item-2',
                label: 'Select Item',
            },
        });

        const selectedItem = container.querySelector('.selected-item');
        expect(selectedItem).toBeTruthy();
        expect(selectedItem.textContent).toContain('Test Item 2');
    });

    test('should toggle item list visibility', async () => {
        const component = new ItemSelector({
            target: container,
            props: {
                items: mockItems,
                selectedItemId: 'item-2',
                label: 'Select Item',
            },
        });

        // Initially collapsed (since we have a selectedItemId)
        let itemsList = container.querySelector('.items-list');
        expect(itemsList).toBeFalsy();

        // Click edit to expand
        const editButton = container.querySelector('.edit-button');
        expect(editButton).toBeTruthy();
        editButton.click();

        await new Promise((resolve) => setTimeout(resolve, 0));
        itemsList = container.querySelector('.items-list');
        expect(itemsList).toBeTruthy();
    });

    test('should handle empty items array', () => {
        const component = new ItemSelector({
            target: container,
            props: {
                items: [],
                selectedItemId: '',
                label: 'Select Item',
            },
        });

        const itemsList = container.querySelector('.items-list');
        expect(itemsList).toBeTruthy();
        expect(container.querySelectorAll('.item-row')).toHaveLength(0);
    });

    test('should handle invalid selectedItemId', () => {
        const component = new ItemSelector({
            target: container,
            props: {
                items: mockItems,
                selectedItemId: 'invalid-id',
                label: 'Select Item',
            },
        });

        const selectedItem = container.querySelector('.selected-item');
        expect(selectedItem).toBeFalsy();
    });
});
