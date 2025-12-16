import { render, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import { vi } from 'vitest';
import Chip from '../svelte/Chip.svelte';
import CompactItemList from '../svelte/CompactItemList.svelte';
import DelayedRender from '../svelte/DelayedRender.svelte';
import ProgressBar from '../svelte/ProgressBar.svelte';
import RemainingTime from '../svelte/RemainingTime.svelte';

vi.mock('../../utils/gameState/inventory.js', () => ({
    getItemCounts: vi.fn(() => ({ oxygen: 2, fuel: 5 })),
}));

vi.mock('../../utils.js', async (original) => {
    const actual = await original();
    return {
        ...actual,
        prettyPrintNumber: (value: number) => String(value),
        prettyPrintDuration: (value: number) => `${Math.round(value)}s`,
    };
});

test('Chip renders anchors and dispatches click events', async () => {
    const { getByText, component } = render(Chip, {
        props: { text: 'Launch', href: '/launch' },
    });

    expect(getByText('Launch').closest('a')).toHaveAttribute('href', '/launch');

    const handler = vi.fn();
    component.$set({ href: undefined, text: 'Fire', disabled: false, onClick: handler });

    const button = getByText('Fire');
    component.$on('click', handler);
    await fireEvent.click(button);
    expect(handler).toHaveBeenCalled();
});

test('DelayedRender swaps fallback with content after delay', async () => {
    vi.useFakeTimers();
    const { getByText, queryByText } = render(DelayedRender, {
        props: { delaySeconds: 0.1 },
        slots: {
            fallback: '<span>Loading...</span>',
            content: '<span>Ready</span>',
        },
    });

    expect(getByText('Loading...')).toBeInTheDocument();
    vi.runAllTimers();
    await tick();
    expect(queryByText('Loading...')).not.toBeInTheDocument();
    expect(getByText('Ready')).toBeInTheDocument();
    vi.useRealTimers();
});

test('RemainingTime updates countdown', async () => {
    vi.useFakeTimers();
    const endDate = Date.now() + 2000;
    const { getByText } = render(RemainingTime, {
        props: { endDate, totalDurationInSeconds: 2 },
    });

    await tick();
    expect(getByText(/remaining/)).toHaveTextContent('2s');

    vi.advanceTimersByTime(1000);
    await tick();
    expect(getByText(/remaining/)).toHaveTextContent('1s');
    vi.useRealTimers();
});

test('ProgressBar emits completion once full', async () => {
    vi.useFakeTimers();
    const onFill = vi.fn();
    const startDate = Date.now();
    const { getByText, component } = render(ProgressBar, {
        props: { startDate, totalDurationSeconds: 1 },
    });

    component.$on('fillComplete', onFill);
    vi.runAllTimers();
    await tick();

    expect(onFill).toHaveBeenCalled();
    expect(getByText(/Progress:/)).toHaveTextContent('100.00%');
    vi.useRealTimers();
});

test('CompactItemList renders increase and decrease rows', async () => {
    vi.useFakeTimers();
    const { container, component } = render(CompactItemList, {
        props: {
            itemList: [
                { id: 'oxygen', name: 'Oxygen', image: '/o2.png', count: 1 },
                { id: 'fuel', name: 'Fuel', image: '/fuel.png', count: 3 },
            ],
            increase: true,
        },
    });

    await tick();
    vi.runOnlyPendingTimers();
    expect(container.querySelectorAll('.horizontal').length).toBeGreaterThan(0);
    expect(container.textContent).toContain('+1');

    await component.$set({
        itemList: [{ id: 'fuel', name: 'Fuel', image: '/fuel.png', count: 1 }],
        decrease: true,
        increase: false,
        noRed: false,
    });
    await tick();
    vi.runOnlyPendingTimers();
    expect(container.textContent).toContain('−1');
    vi.useRealTimers();
});
