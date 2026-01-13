import { render } from '@testing-library/svelte';
import { afterEach, expect, test, vi } from 'vitest';
import RemainingTime from '../svelte/RemainingTime.svelte';

afterEach(() => {
    vi.useRealTimers();
});

test('does not update without a rerender', () => {
    vi.useFakeTimers();
    const startTime = new Date('2026-01-13T00:00:00Z');
    vi.setSystemTime(startTime);

    const { getByText } = render(RemainingTime, {
        endDate: startTime.getTime() + 10_000,
        totalDurationInSeconds: 10,
    });

    const initialRemaining = getByText(/remaining/).textContent;

    vi.advanceTimersByTime(5000);

    expect(getByText(/remaining/).textContent).toBe(initialRemaining);
});
