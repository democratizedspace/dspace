import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import CatalogSelector from '../src/components/svelte/ui/CatalogSelector.svelte';

describe('CatalogSelector touch guard behavior', () => {
    const items = [
        { id: 'item-1', name: 'Item One' },
        { id: 'item-2', name: 'Item Two' },
    ];

    it('keeps the listbox open after touchstart + click on the edit button', async () => {
        render(CatalogSelector, { props: { items, selectedId: 'item-1' } });

        const editButton = await waitFor(() => screen.getByRole('button', { name: 'Edit' }));

        await fireEvent.touchStart(editButton);
        await waitFor(() => expect(screen.getByRole('listbox')).toBeTruthy());

        await fireEvent.click(editButton);
        expect(screen.getByRole('listbox')).toBeTruthy();

        await fireEvent.click(editButton);
        await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
    });

    it('keeps the listbox open after touchstart + click on the select button', async () => {
        const { component } = render(CatalogSelector, {
            props: { items, selectedId: 'item-1', buttonLabel: 'Select Item' },
        });

        await waitFor(() => screen.getByRole('button', { name: 'Edit' }));
        await component.$set({ selectedId: '' });

        const selectButton = await waitFor(() =>
            screen.getByRole('button', { name: 'Select Item' })
        );

        await fireEvent.touchStart(selectButton);
        await waitFor(() => expect(screen.getByRole('listbox')).toBeTruthy());

        await fireEvent.click(selectButton);
        expect(screen.getByRole('listbox')).toBeTruthy();

        await fireEvent.click(selectButton);
        await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
    });

    it('ignores the synthetic click after a touch selection', async () => {
        const { component } = render(CatalogSelector, { props: { items, selectedId: '' } });
        const onSelect = vi.fn();
        component.$on('select', onSelect);

        const option = await waitFor(() => screen.getAllByRole('option')[0]);

        await fireEvent.touchStart(option);
        await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());

        await fireEvent.click(option);
        expect(onSelect).toHaveBeenCalledTimes(1);
    });
});
