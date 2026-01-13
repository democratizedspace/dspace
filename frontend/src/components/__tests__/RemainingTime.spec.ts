import { render } from '@testing-library/svelte';
import { afterEach, expect, test, vi } from 'vitest';
import RemainingTime from '../svelte/RemainingTime.svelte';

afterEach(() => {
    vi.useRealTimers();
});

test('does not update remaining time without a parent render', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-13T00:00:00Z'));

    const { getByText } = render(RemainingTime, {
        endDate: Date.now() + 10000,
        totalDurationInSeconds: 10,
    });

    const remainingText = getByText(/remaining/);
    const initialText = remainingText.textContent;

    vi.advanceTimersByTime(5000);

    expect(remainingText.textContent).toBe(initialText);
});
