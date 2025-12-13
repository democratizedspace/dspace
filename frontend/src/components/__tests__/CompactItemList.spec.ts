import { render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CompactItemList from '../svelte/CompactItemList.svelte';

const grantItems = [
    { id: 'd88ef09c-9191-4c18-8628-a888bb9f926d', count: 10 },
    { id: '5247a603-294a-4a34-a884-1ae20969b2a1', count: 100 },
];

describe('CompactItemList', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.clearAllTimers();
        vi.useRealTimers();
    });

    it('renders items even when counts start at zero', async () => {
        render(CompactItemList, {
            props: {
                itemList: grantItems,
                increase: true,
            },
        });

        vi.runOnlyPendingTimers();

        await waitFor(() => {
            expect(screen.getByText(/dCarbon/i)).toBeTruthy();
            expect(screen.getByText(/dUSD/i)).toBeTruthy();
        });

        const textContent = screen.getByText(/dCarbon/i).textContent || '';
        expect(textContent).toMatch(/10/);
    });
});
