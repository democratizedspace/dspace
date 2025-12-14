import { render, fireEvent } from '@testing-library/svelte';
import Process from '../svelte/Process.svelte';
import { vi, expect, test } from 'vitest';
import { tick } from 'svelte';

const ProcessStates = vi.hoisted(() => ({
    NOT_STARTED: 'not started',
    IN_PROGRESS: 'in progress',
    FINISHED: 'finished',
    PAUSED: 'paused',
}));

const stateInfo = vi.hoisted(() => ({ state: ProcessStates.IN_PROGRESS, progress: 0 }));
const getItemCountsMock = vi.hoisted(() => vi.fn(() => ({ 'item-1': 0 })));

vi.mock('../../pages/inventory/json/items', () => ({
    default: [
        {
            id: 'item-1',
            name: 'Test Item',
            image: '/test.png',
        },
    ],
}));

vi.mock('../../utils/gameState/inventory.js', () => ({
    getItemCounts: (...args) => getItemCountsMock(...args),
}));

const pauseProcess = vi.hoisted(() =>
    vi.fn(() => {
        stateInfo.state = ProcessStates.PAUSED;
    })
);
const resumeProcess = vi.hoisted(() =>
    vi.fn(() => {
        stateInfo.state = ProcessStates.IN_PROGRESS;
    })
);

vi.mock('../../generated/processes.json', () => ({
    default: [
        {
            id: 'p1',
            title: 'Test Process',
            duration: '10s',
            requireItems: [],
            consumeItems: [],
            createItems: [],
        },
        {
            id: 'p2',
            title: 'Process With Requirements',
            duration: '1m',
            requireItems: [
                {
                    id: 'item-1',
                    count: 2,
                },
            ],
            consumeItems: [],
            createItems: [],
        },
    ],
}));

vi.mock('../../utils/gameState/processes.js', () => ({
    startProcess: vi.fn(),
    cancelProcess: vi.fn(),
    finishProcess: vi.fn(),
    getProcessState: vi.fn(() => stateInfo),
    ProcessStates,
    getProcessStartedAt: vi.fn(() => Date.now()),
    pauseProcess,
    resumeProcess,
}));

test('pauses and resumes a process while showing remaining time', async () => {
    const { getByText } = render(Process, { processId: 'p1' });

    await tick();
    expect(getByText(/remaining/)).toBeTruthy();

    // pause the process
    await fireEvent.click(getByText('Pause'));
    expect(pauseProcess).toHaveBeenCalledWith('p1');
    await tick();
    expect(getByText(/remaining/)).toBeTruthy();

    // resume the process
    await fireEvent.click(getByText('Resume'));
    expect(resumeProcess).toHaveBeenCalledWith('p1');
    await tick();
    expect(getByText(/remaining/)).toBeTruthy();
});

test('shows required items even when counts are zero', async () => {
    getItemCountsMock.mockReturnValue({ 'item-1': 0 });

    const { getByText } = render(Process, { processId: 'p2' });

    await tick();
    const requireSection = getByText('Requires:').parentElement;
    const normalizedText = requireSection?.textContent?.replace(/\s+/g, ' ');

    expect(normalizedText).toContain('Requires:');
    expect(normalizedText).toMatch(/2\s*\/\s*0/);
    expect(normalizedText).toMatch(/Test Item/);
    expect(normalizedText).not.toMatch(/0\s*\/\s*2/);
});
