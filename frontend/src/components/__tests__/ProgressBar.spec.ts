import { render } from '@testing-library/svelte';
import { afterEach, expect, test, vi } from 'vitest';
import ProgressBar from '../svelte/ProgressBar.svelte';

afterEach(() => {
    vi.useRealTimers();
});

test('does not update progress without a parent render', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-13T00:00:00Z'));

    const { getByText } = render(ProgressBar, {
        startDate: new Date(Date.now()),
        totalDurationSeconds: 10,
    });

    const progressText = getByText(/Progress:/);
    const timeLeftText = getByText(/Time Left:/);
    const initialProgress = progressText.textContent;
    const initialTime = timeLeftText.textContent;

    vi.advanceTimersByTime(5000);

    expect(progressText.textContent).toBe(initialProgress);
    expect(timeLeftText.textContent).toBe(initialTime);
});
