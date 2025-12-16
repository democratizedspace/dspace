import { render, fireEvent } from '@testing-library/svelte';
import { vi } from 'vitest';
import { tick } from 'svelte';
import SearchBar from '../svelte/SearchBar.svelte';

test('filters items and exposes an accessible label', async () => {
    const data = [
        { id: '1', name: 'Alpha' },
        { id: '2', name: 'Beta' },
    ];

    const handler = vi.fn();
    const { getByLabelText } = render(SearchBar, {
        props: { data },
        events: {
            search: (event: CustomEvent) => handler(event.detail),
        },
    });
    await tick();
    const input = getByLabelText('Search items');

    await fireEvent.input(input, { target: { value: 'Al' } });

    expect(handler).toHaveBeenCalledWith([{ id: '1', name: 'Alpha' }]);
});

test('shows placeholder before hydration and supports multi-word search', async () => {
    const data = [
        { id: '1', name: 'Lunar Drill', description: 'Deep mining' },
        { id: '2', name: 'Solar Panel', description: 'Surface power' },
    ];

    const handler = vi.fn();
    const { getByText, getByLabelText } = render(SearchBar, {
        props: { data },
        events: {
            search: (event: CustomEvent) => handler(event.detail),
        },
    });

    expect(getByText('Loading search...')).toBeInTheDocument();
    await tick();

    const input = getByLabelText('Search items');
    await fireEvent.input(input, { target: { value: 'Solar power' } });

    expect(handler).toHaveBeenLastCalledWith([data[1]]);

    await fireEvent.input(input, { target: { value: '' } });
    expect(handler).toHaveBeenLastCalledWith(data);
});
