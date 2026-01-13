import { render } from '@testing-library/svelte';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import RemainingTime from '../svelte/RemainingTime.svelte';

beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-13T00:00:00Z'));
});

afterEach(() => {
    vi.useRealTimers();
});

test('does not advance without a rerender tick', () => {
    const endDate = Date.now() + 10000;
    const { getByText } = render(RemainingTime, {
        props: {
            endDate,
            totalDurationInSeconds: 10,
        },
    });

    const initialRemaining = getByText(/remaining/).textContent;

    vi.advanceTimersByTime(4000);

    expect(getByText(/remaining/).textContent).toBe(initialRemaining);
});
