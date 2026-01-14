import { render } from '@testing-library/svelte';
import { afterEach, expect, test, vi } from 'vitest';
import { tick } from 'svelte';
import ProgressBar from '../svelte/ProgressBar.svelte';

afterEach(() => {
    vi.useRealTimers();
});

test('does not advance without parent updates', async () => {
    vi.useFakeTimers();
    const startDate = new Date('2026-01-13T00:00:00.000Z');
    vi.setSystemTime(startDate);

    const { getByText } = render(ProgressBar, {
        startDate,
        totalDurationSeconds: 10,
        currentTime: startDate.getTime(),
    });

    const initialProgress = getByText(/Progress:/).textContent;
    const initialTimeLeft = getByText(/Time Left:/).textContent;

    vi.advanceTimersByTime(5000);
    await tick();

    expect(getByText(/Progress:/).textContent).toBe(initialProgress);
    expect(getByText(/Time Left:/).textContent).toBe(initialTimeLeft);
});

test('marks duration zero as complete and dispatches once', async () => {
    vi.useFakeTimers();
    const startDate = new Date('2026-01-13T00:00:00.000Z');
    vi.setSystemTime(startDate);

    const onComplete = vi.fn();
    const { getByText, rerender } = render(ProgressBar, {
        props: {
            startDate,
            totalDurationSeconds: 1,
            currentTime: startDate.getTime(),
        },
        events: {
            fillComplete: onComplete,
        },
    });

    await tick();
    expect(onComplete).toHaveBeenCalledTimes(0);

    await rerender({ startDate, totalDurationSeconds: 0, currentTime: startDate.getTime() });
    await tick();

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(getByText(/Progress:/).textContent).toContain('100.00%');
});
