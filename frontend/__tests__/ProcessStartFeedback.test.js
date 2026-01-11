/**
 * @jest-environment jsdom
 */
import { fireEvent, render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest';
import Process from '../src/components/svelte/Process.svelte';
import items from '../src/pages/inventory/json/items';
import { startProcess } from '../src/utils/gameState/processes.js';

const [firstItem, secondItem] = items;

vi.mock('../src/generated/processes.json', () => ({
    default: [
        {
            id: 'test-process',
            title: 'Test Process',
            duration: '1h',
            requireItems: [{ id: firstItem.id, count: 1 }],
            consumeItems: [{ id: secondItem.id, count: 2 }],
            createItems: [],
        },
    ],
}));

vi.mock('../src/utils/gameState/inventory.js', () => ({
    getItemCounts: vi.fn((itemList = []) =>
        Object.fromEntries(itemList.map((item) => [item.id, 0]))
    ),
}));

vi.mock('../src/utils/gameState/processes.js', async () => {
    const actual = await vi.importActual('../src/utils/gameState/processes.js');
    return {
        ...actual,
        startProcess: vi.fn(),
        cancelProcess: vi.fn(),
        finishProcess: vi.fn(),
        pauseProcess: vi.fn(),
        resumeProcess: vi.fn(),
        getProcessState: vi.fn(() => ({
            state: actual.ProcessStates.NOT_STARTED,
            progress: 0,
        })),
        getProcessStartedAt: vi.fn(() => Date.now()),
    };
});

describe('Process start missing requirements feedback', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    it('pulses missing requirement sections and queues a single rerun', async () => {
        const { getByTestId, getByText, queryByTestId } = render(Process, {
            props: { processId: 'test-process' },
        });

        const startChip = getByText('Start');
        await fireEvent.click(startChip);

        const startButton = getByTestId('process-start-button');
        const requiresBlock = getByTestId('process-requires-items');
        const consumesBlock = getByTestId('process-consumes-items');
        const message = getByTestId('process-start-error-message');

        expect(startProcess).not.toHaveBeenCalled();
        expect(startButton.classList.contains('buttonPulse')).toBe(true);
        expect(requiresBlock.classList.contains('pulse')).toBe(true);
        expect(consumesBlock.classList.contains('pulse')).toBe(true);
        expect(message.textContent).toContain('Missing requirements');

        await fireEvent.click(startChip);
        await fireEvent.click(startChip);

        vi.advanceTimersByTime(1000);
        await tick();

        expect(startButton.classList.contains('buttonPulse')).toBe(true);
        expect(getByTestId('process-start-error-message')).toBeTruthy();

        vi.advanceTimersByTime(1000);
        await tick();

        expect(startButton.classList.contains('buttonPulse')).toBe(false);
        expect(requiresBlock.classList.contains('pulse')).toBe(false);
        expect(consumesBlock.classList.contains('pulse')).toBe(false);
        expect(queryByTestId('process-start-error-message')).toBeNull();
    });
});
