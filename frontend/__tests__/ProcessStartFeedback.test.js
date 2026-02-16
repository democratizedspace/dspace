/**
 * @jest-environment jsdom
 */
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/svelte';
import { tick } from 'svelte';
import Process from '../src/components/svelte/Process.svelte';
import { hasRequiredAndConsumedItems, startProcess } from '../src/utils/gameState/processes.js';

let mockCounts = {};
const pulseDurationMs = 1050;

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
        {
            id: 'shared-process',
            title: 'Shared Process',
            duration: '1h',
            requireItems: [{ id: 'shared-item', count: 2 }],
            consumeItems: [{ id: 'shared-item', count: 2 }],
            createItems: [],
        },
    ],
}));

vi.mock('../src/pages/inventory/json/items', () => ({
    default: [
        { id: 'req-item', name: 'Required Item' },
        { id: 'cons-item', name: 'Consumed Item' },
        { id: 'shared-item', name: 'Shared Item' },
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
        hasRequiredAndConsumedItems: vi.fn(() => true),
    };
});

describe('Process start feedback', () => {
    let originalScrollIntoView;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
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
        const timeoutSpy = vi.spyOn(global, 'setTimeout');
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
        await fireEvent.click(startButton);
        await fireEvent.click(startButton);
        await fireEvent.click(startButton);
        await tick();

        expect(timeoutSpy.mock.calls.filter((call) => call[1] === pulseDurationMs)).toHaveLength(1);

        vi.advanceTimersByTime(pulseDurationMs);
        await tick();

        expect(startAction.classList.contains('pulse')).toBe(true);
        expect(getByTestId('process-start-feedback')).toBeTruthy();
        expect(timeoutSpy.mock.calls.filter((call) => call[1] === pulseDurationMs)).toHaveLength(2);

        vi.advanceTimersByTime(pulseDurationMs);
        await tick();

        expect(startAction.classList.contains('pulse')).toBe(false);
        expect(queryByTestId('process-start-feedback')).toBeNull();

        vi.advanceTimersByTime(pulseDurationMs);
        await tick();

        expect(startAction.classList.contains('pulse')).toBe(false);
        expect(queryByTestId('process-start-feedback')).toBeNull();
    });

    it('starts the process when requirements are met', async () => {
        mockCounts = { 'req-item': 2, 'cons-item': 1 };

        const { getByTestId } = render(Process, {
            props: { processId: 'test-process' },
        });

        await fireEvent.click(getByTestId('process-start-button'));
        await tick();

        expect(startProcess).toHaveBeenCalledWith(
            'test-process',
            expect.objectContaining({ id: 'test-process' })
        );
    });

    it('shows feedback when non-inventory start requirements are not met', async () => {
        mockCounts = { 'req-item': 2, 'cons-item': 1 };
        hasRequiredAndConsumedItems.mockReturnValue(false);

        const { getByTestId } = render(Process, {
            props: { processId: 'test-process' },
        });

        await fireEvent.click(getByTestId('process-start-button'));
        await tick();

        expect(startProcess).not.toHaveBeenCalled();
        expect(getByTestId('process-start-action').classList.contains('pulse')).toBe(true);
        expect(getByTestId('process-start-feedback').textContent).toContain(
            'Cannot start yet: process storage requirements are not met.'
        );
    });

    it('pulses only the required section when consume items are satisfied', async () => {
        mockCounts = { 'req-item': 1, 'cons-item': 1 };

        const { getByTestId } = render(Process, {
            props: { processId: 'test-process' },
        });

        await fireEvent.click(getByTestId('process-start-button'));
        await tick();

        expect(getByTestId('process-requires').classList.contains('pulse')).toBe(true);
        expect(getByTestId('process-consumes').classList.contains('pulse')).toBe(false);
        expect(getByTestId('process-start-feedback').textContent).toContain('Required Item');
    });

    it('scrolls missing requirements into view when offscreen', async () => {
        const { getByTestId } = render(Process, {
            props: { processId: 'test-process' },
        });

        const requires = getByTestId('process-requires');
        requires.getBoundingClientRect = () => ({
            top: -20,
            left: 0,
            bottom: -10,
            right: 0,
        });

        await fireEvent.click(getByTestId('process-start-button'));
        await tick();

        expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    });

    it('does not double-count shared items across required and consumed lists', async () => {
        mockCounts = { 'shared-item': 1 };

        const { getByTestId } = render(Process, {
            props: { processId: 'shared-process' },
        });

        await fireEvent.click(getByTestId('process-start-button'));
        await tick();

        expect(getByTestId('process-start-feedback').textContent).toContain('Shared Item (1)');
    });
});
