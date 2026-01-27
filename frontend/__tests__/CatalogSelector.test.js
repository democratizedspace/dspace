import { fireEvent } from '@testing-library/dom';
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

    test('click toggles the selector open and closed', async () => {
        new CatalogSelector({
            target: container,
            props: {
                items: mockItems,
                selectedId: 'item-1',
                label: 'Select Item',
            },
        });

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(container.querySelector('.items-list')).toBeFalsy();

        const editButton = container.querySelector('.edit-button');
        await fireEvent.click(editButton);

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(container.querySelector('.items-list')).toBeTruthy();

        await fireEvent.click(editButton);

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(container.querySelector('.items-list')).toBeFalsy();
    });

    test('touch interaction opens once and ignores ghost clicks', async () => {
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
        await fireEvent.touchStart(editButton);
        await fireEvent.click(editButton);

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(container.querySelector('.items-list')).toBeTruthy();
    });
});
