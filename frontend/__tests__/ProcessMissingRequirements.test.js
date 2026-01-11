/**
 * @jest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/svelte';
import { tick } from 'svelte';
import Process from '../src/components/svelte/Process.svelte';

const mockState = { state: 'not started', progress: 0 };

const startProcess = vi.fn();
const hasRequiredAndConsumedItems = vi.fn(() => false);
const getItemCounts = vi.fn(() => ({ 'item-1': 1, 'item-2': 0 }));

vi.mock('../src/generated/processes.json', () => ({
    default: [
        {
            id: 'proc-1',
            title: 'Solar Power',
            duration: '1h',
            requireItems: [{ id: 'item-1', count: 2 }],
            consumeItems: [{ id: 'item-2', count: 1 }],
            createItems: [],
        },
    ],
}));

vi.mock('../src/pages/inventory/json/items', () => ({
    default: [
        { id: 'item-1', name: 'Solar setup', image: '/solar.png' },
        { id: 'item-2', name: 'Battery', image: '/battery.png' },
    ],
}));

vi.mock('../src/utils/gameState/inventory.js', () => ({
    getItemCounts,
}));

vi.mock('../src/utils/gameState/processes.js', async () => {
    const actual = await vi.importActual('../src/utils/gameState/processes.js');
    return {
        ...actual,
        startProcess,
        cancelProcess: vi.fn(),
        finishProcess: vi.fn(),
        pauseProcess: vi.fn(),
        resumeProcess: vi.fn(),
        hasRequiredAndConsumedItems,
        getProcessState: vi.fn(() => mockState),
        getProcessStartedAt: vi.fn(() => Date.now()),
    };
});

describe('Process missing requirements feedback', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        window.alert = vi.fn();
        Element.prototype.scrollIntoView = vi.fn();
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    it('pulses missing sections and queues a single rerun on repeated clicks', async () => {
        const { getByText, getByTestId, queryByTestId } = render(Process, {
            props: { processId: 'proc-1' },
        });

        await tick();

        const startButton = getByText('Start');

        await fireEvent.click(startButton);
        await tick();

        const startWrapper = getByTestId('process-start-wrapper');
        const requires = getByTestId('process-requires');
        const consumes = getByTestId('process-consumes');

        expect(startWrapper.classList.contains('pulse-button')).toBe(true);
        expect(requires.classList.contains('pulse-border')).toBe(true);
        expect(consumes.classList.contains('pulse-border')).toBe(true);
        expect(getByTestId('process-missing-message').textContent).toContain(
            'Missing requirements'
        );

        await fireEvent.click(startButton);

        vi.advanceTimersByTime(1000);
        await tick();

        expect(startWrapper.classList.contains('pulse-button')).toBe(true);

        vi.advanceTimersByTime(1000);
        await tick();

        expect(startWrapper.classList.contains('pulse-button')).toBe(false);
        expect(queryByTestId('process-missing-message')).toBeNull();
        expect(startProcess).not.toHaveBeenCalled();
    });
});
