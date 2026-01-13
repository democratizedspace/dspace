import { render } from '@testing-library/svelte';
import { afterEach, expect, test, vi } from 'vitest';
import { tick } from 'svelte';
import RemainingTime from '../svelte/RemainingTime.svelte';

afterEach(() => {
    vi.useRealTimers();
});

test('does not update without parent-driven rerenders', async () => {
    vi.useFakeTimers();
    const now = new Date('2026-01-13T00:00:00.000Z');
    vi.setSystemTime(now);

    const endDate = now.getTime() + 10000;
    const { getByText } = render(RemainingTime, {
        endDate,
        currentTime: now.getTime(),
    });

    const initialText = getByText(/remaining/).textContent;

    vi.advanceTimersByTime(5000);
    await tick();

    expect(getByText(/remaining/).textContent).toBe(initialText);
});
