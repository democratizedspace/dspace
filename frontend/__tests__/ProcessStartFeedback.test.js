/**
 * @jest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/svelte';
import Process from '../src/components/svelte/Process.svelte';
import processes from '../src/generated/processes.json';
import items from '../src/pages/inventory/json/items';

vi.mock('../src/utils/gameState/processes.js', async () => {
    const actual = await vi.importActual('../src/utils/gameState/processes.js');
    return {
        ...actual,
        startProcess: vi.fn(),
        cancelProcess: vi.fn(),
        finishProcess: vi.fn(),
        pauseProcess: vi.fn(),
        resumeProcess: vi.fn(),
        finishProcessNow: vi.fn(),
        getProcessState: vi.fn(() => ({
            state: actual.ProcessStates.NOT_STARTED,
            progress: 0,
        })),
        getProcessStartedAt: vi.fn(() => Date.now()),
        hasRequiredAndConsumedItems: vi.fn(() => false),
    };
});

vi.mock('../src/utils/gameState/inventory.js', async () => {
    const actual = await vi.importActual('../src/utils/gameState/inventory.js');
    return {
        ...actual,
        getItemCount: vi.fn(() => 0),
    };
});

describe('Process start feedback', () => {
    const processId = 'outlet-dWatt-1e3';
    const process = processes.find((entry) => entry.id === processId);
    const requiredItemId = process.requireItems[0].id;
    const requiredItemName = items.find((item) => item.id === requiredItemId)?.name ?? 'Unknown';

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('pulses missing requirements and queues a single rerun', async () => {
        const setTimeoutSpy = vi.spyOn(global, 'setTimeout');
        const { getByTestId, getByText, queryByTestId, queryByText } = render(Process, {
            props: { processId },
        });

        const startButton = getByTestId('process-start');

        await fireEvent.click(startButton);

        const startWrapper = startButton.closest('.start-action');
        expect(startWrapper?.classList.contains('start-pulse')).toBe(true);
        expect(getByTestId('process-requires').classList.contains('requirements-pulse')).toBe(
            true
        );
        expect(queryByTestId('process-consumes')).toBeNull();
        expect(getByText(`Missing requirements: ${requiredItemName} (1)`)).toBeTruthy();
        expect(setTimeoutSpy).toHaveBeenCalledTimes(1);

        await fireEvent.click(startButton);
        expect(setTimeoutSpy).toHaveBeenCalledTimes(1);

        vi.advanceTimersByTime(1000);
        await vi.runOnlyPendingTimersAsync();
        expect(setTimeoutSpy).toHaveBeenCalledTimes(2);
        expect(getByTestId('process-requires').classList.contains('requirements-pulse')).toBe(
            true
        );

        vi.advanceTimersByTime(1000);
        await vi.runOnlyPendingTimersAsync();
        expect(getByTestId('process-requires').classList.contains('requirements-pulse')).toBe(
            false
        );
        expect(queryByText(/Missing requirements:/)).toBeNull();
    });
});
