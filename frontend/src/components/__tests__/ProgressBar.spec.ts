import { render } from '@testing-library/svelte';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import ProgressBar from '../svelte/ProgressBar.svelte';

beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-13T00:00:00Z'));
});

afterEach(() => {
    vi.useRealTimers();
});

test('does not advance without a rerender tick', () => {
    const startDate = Date.now();
    const { getByText } = render(ProgressBar, {
        props: {
            startDate,
            totalDurationSeconds: 10,
        },
    });

    const initialProgress = getByText(/Progress:/).textContent;
    const initialTimeLeft = getByText(/Time Left:/).textContent;

    vi.advanceTimersByTime(3000);

    expect(getByText(/Progress:/).textContent).toBe(initialProgress);
    expect(getByText(/Time Left:/).textContent).toBe(initialTimeLeft);
});
