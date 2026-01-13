import { render } from '@testing-library/svelte';
import { afterEach, expect, test, vi } from 'vitest';
import ProgressBar from '../svelte/ProgressBar.svelte';

afterEach(() => {
    vi.useRealTimers();
});

test('does not update without a rerender', () => {
    vi.useFakeTimers();
    const startTime = new Date('2026-01-13T00:00:00Z');
    vi.setSystemTime(startTime);

    const { getByText } = render(ProgressBar, {
        startDate: startTime,
        totalDurationSeconds: 10,
    });

    const initialProgress = getByText(/Progress:/).textContent;
    const initialTimeLeft = getByText(/Time Left:/).textContent;

    vi.advanceTimersByTime(5000);

    expect(getByText(/Progress:/).textContent).toBe(initialProgress);
    expect(getByText(/Time Left:/).textContent).toBe(initialTimeLeft);
});
