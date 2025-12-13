import { render, fireEvent } from '@testing-library/svelte';
import { vi } from 'vitest';
import { tick } from 'svelte';
import SearchBar from '../svelte/SearchBar.svelte';

test('filters items and exposes an accessible label', async () => {
    const data = [
        { id: '1', name: 'Alpha' },
        { id: '2', name: 'Beta' },
    ];

    const { getByLabelText, component } = render(SearchBar, { data });
    await tick();
    const input = getByLabelText('Search items');

    const handler = vi.fn();
    component.$on('search', (e) => handler(e.detail));

    await fireEvent.input(input, { target: { value: 'Al' } });

    expect(handler).toHaveBeenCalledWith([{ id: '1', name: 'Alpha' }]);
});
