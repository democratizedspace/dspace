/**
 * @jest-environment jsdom
 */
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/svelte';
import { tick } from 'svelte';
import Process from '../src/components/svelte/Process.svelte';
import { startProcess } from '../src/utils/gameState/processes.js';

let mockCounts = {};

vi.mock('../src/generated/processes.json', () => ({
    default: [
        {
            id: 'test-process',
            title: 'Test Process',
            duration: '1h',
            requireItems: [{ id: 'req-item', count: 2 }],
            consumeItems: [{ id: 'cons-item', count: 1 }],
            createItems: [],
        },
    ],
}));

vi.mock('../src/utils/gameState/inventory.js', () => ({
    getItemCounts: vi.fn((items) => {
        const counts = {};
        items.forEach((item) => {
            counts[item.id] = mockCounts[item.id] ?? 0;
        });
        return counts;
    }),
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
        finishProcessNow: vi.fn(),
        getProcessState: vi.fn(() => ({
            state: actual.ProcessStates.NOT_STARTED,
            progress: 0,
        })),
        getProcessStartedAt: vi.fn(() => Date.now()),
    };
});

describe('Process start feedback', () => {
    let originalScrollIntoView;

    beforeEach(() => {
        vi.useFakeTimers();
        mockCounts = { 'req-item': 0, 'cons-item': 0 };
        originalScrollIntoView = Element.prototype.scrollIntoView;
        Element.prototype.scrollIntoView = vi.fn();
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        Element.prototype.scrollIntoView = originalScrollIntoView;
    });

    it('pulses missing requirement sections and queues a single rerun', async () => {
        const { getByTestId, queryByTestId } = render(Process, {
            props: { processId: 'test-process' },
        });

        const startButton = getByTestId('process-start-button');
        const startAction = getByTestId('process-start-action');
        const requires = getByTestId('process-requires');
        const consumes = getByTestId('process-consumes');

        await fireEvent.click(startButton);
        await tick();

        expect(startProcess).not.toHaveBeenCalled();
        expect(startAction.classList.contains('pulse')).toBe(true);
        expect(requires.classList.contains('pulse')).toBe(true);
        expect(consumes.classList.contains('pulse')).toBe(true);
        expect(getByTestId('process-start-feedback').textContent).toContain(
            'Missing requirements:'
        );

        await fireEvent.click(startButton);
        await tick();

        vi.advanceTimersByTime(1000);
        await tick();

        expect(startAction.classList.contains('pulse')).toBe(true);
        expect(getByTestId('process-start-feedback')).toBeTruthy();

        vi.advanceTimersByTime(1000);
        await tick();

        expect(startAction.classList.contains('pulse')).toBe(false);
        expect(queryByTestId('process-start-feedback')).toBeNull();
    });
});
