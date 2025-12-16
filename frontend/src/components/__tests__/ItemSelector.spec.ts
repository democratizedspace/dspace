import { fireEvent, render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { vi } from 'vitest';
import ItemSelector from '../svelte/ItemSelector.svelte';

const sampleItems = [
    { id: 'alpha', name: 'Alpha', description: 'first', image: '/alpha.png' },
    { id: 'beta', name: 'Beta', description: 'second', image: '/beta.png' },
];

test('shows loading placeholder before hydration and exposes select button after mount', async () => {
    const { getByText, container } = render(ItemSelector, {
        props: { label: 'Pick item', items: sampleItems },
    });

    expect(getByText('Loading item selector...')).toBeInTheDocument();

    await tick();

    const selector = container.querySelector('.item-selector');
    expect(selector?.getAttribute('data-hydrated')).toBe('true');
    expect(getByText('Select Item')).toBeInTheDocument();
});

test('filters items via search and dispatches selection', async () => {
    const onSelect = vi.fn();

    const { getByLabelText, getByRole, queryByRole, component } = render(ItemSelector, {
        props: { items: sampleItems },
    });

    component.$on('select', (event) => onSelect(event.detail.itemId));

    await tick();

    const trigger = getByRole('button', { name: /select item/i });
    await fireEvent.click(trigger);

    const searchInput = getByLabelText('Search items');
    await fireEvent.input(searchInput, { target: { value: 'beta' } });

    expect(queryByRole('option', { name: /Alpha/ })).not.toBeInTheDocument();

    const betaOption = getByRole('option', { name: /beta/i });
    await fireEvent.click(betaOption);

    expect(onSelect).toHaveBeenCalledWith('beta');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
});

test('renders selected item summary and allows reopening', async () => {
    const { getByText, getByRole } = render(ItemSelector, {
        props: { items: sampleItems, selectedItemId: 'alpha' },
    });

    await tick();

    expect(getByText('Alpha')).toBeInTheDocument();

    const editButton = getByRole('button', { name: /edit/i });
    await fireEvent.click(editButton);

    const alphaOption = getByRole('option', { name: /alpha/i });
    expect(alphaOption).toBeInTheDocument();
});
