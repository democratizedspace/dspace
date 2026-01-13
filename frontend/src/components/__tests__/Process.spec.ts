import { render, fireEvent } from '@testing-library/svelte';
import Process from '../svelte/Process.svelte';
import { vi, expect, test, beforeEach, afterEach } from 'vitest';
import { tick } from 'svelte';
import { writable } from 'svelte/store';

const ProcessStates = vi.hoisted(() => ({
    NOT_STARTED: 'not started',
    IN_PROGRESS: 'in progress',
    FINISHED: 'finished',
    PAUSED: 'paused',
}));

const stateInfo = vi.hoisted(() => ({ state: ProcessStates.IN_PROGRESS, progress: 0 }));
const processStartTime = vi.hoisted(() => ({ value: 0 }));
const getItemCountsMock = vi.hoisted(() => vi.fn(() => ({ 'item-1': 0 })));
const cheatsAvailabilityStore = writable(false);
const cheatsEnabledStore = writable(false);
const finishProcessNow = vi.hoisted(() => vi.fn());

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
    getProcessStartedAt: vi.fn(() => processStartTime.value),
    pauseProcess,
    resumeProcess,
    finishProcessNow,
}));

vi.mock('../../lib/qaCheats', () => ({
    qaCheatsAvailability: {
        subscribe: (...args) => cheatsAvailabilityStore.subscribe(...args),
    },
    qaCheatsEnabled: {
        subscribe: (...args) => cheatsEnabledStore.subscribe(...args),
    },
    initializeQaCheats: vi.fn(),
}));

beforeEach(() => {
    cheatsAvailabilityStore.set(false);
    cheatsEnabledStore.set(false);
    stateInfo.state = ProcessStates.IN_PROGRESS;
    finishProcessNow.mockClear();
});

afterEach(() => {
    vi.useRealTimers();
});

test('pauses and resumes a process while showing remaining time', async () => {
    vi.useFakeTimers();
    const startTime = new Date('2026-01-13T00:00:00Z');
    vi.setSystemTime(startTime);
    processStartTime.value = startTime.getTime();

    const { getByText, rerender } = render(Process, { processId: 'p1' });

    await tick();
    expect(getByText(/remaining/)).toBeTruthy();

    // pause the process
    await fireEvent.click(getByText('Pause'));
    expect(pauseProcess).toHaveBeenCalledWith('p1');
    await tick();
    const pausedRemaining = getByText(/remaining/).textContent;

    vi.advanceTimersByTime(5000);
    await tick();
    expect(getByText(/remaining/).textContent).toBe(pausedRemaining);

    // resume the process
    await fireEvent.click(getByText('Resume'));
    expect(resumeProcess).toHaveBeenCalledWith('p1');
    await tick();
    const resumedRemaining = getByText(/remaining/).textContent;

    vi.advanceTimersByTime(1500);
    processStartTime.value = startTime.getTime() - 1000;
    await rerender({ processId: 'p1' });
    await tick();
    expect(getByText(/remaining/).textContent).not.toBe(resumedRemaining);
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

test('renders instant finish chip when cheats are enabled', async () => {
    cheatsAvailabilityStore.set(true);
    cheatsEnabledStore.set(true);

    const { getByTestId } = render(Process, { processId: 'p1' });

    await tick();
    const chip = getByTestId('qa-instant-finish-chip');
    expect(chip).toBeTruthy();

    await fireEvent.click(chip);
    expect(finishProcessNow).toHaveBeenCalledWith('p1');
});

test('renders instant finish chip for paused processes', async () => {
    cheatsAvailabilityStore.set(true);
    cheatsEnabledStore.set(true);
    stateInfo.state = ProcessStates.PAUSED;

    const { getByTestId } = render(Process, { processId: 'p1' });

    await tick();
    const chip = getByTestId('qa-instant-finish-chip');
    expect(chip).toBeTruthy();

    await fireEvent.click(chip);
    expect(finishProcessNow).toHaveBeenCalledWith('p1');
});

test('shows custom process note when rendering a custom process', async () => {
    const customProcess = {
        id: 'custom-1',
        title: 'Custom Process',
        duration: '5s',
        requireItems: [],
        consumeItems: [],
        createItems: [],
        custom: true,
    };

    const { getByText, queryByTestId } = render(Process, {
        processId: 'custom-1',
        processData: customProcess,
    });

    await tick();
    expect(getByText('Duration: 5s')).toBeTruthy();
    expect(
        getByText('Custom processes are displayed for reference and managed separately.')
    ).toBeTruthy();
    expect(queryByTestId('qa-instant-finish-chip')).toBeNull();
});

test('prefers provided process data over built-in catalog lookup', async () => {
    const customOverride = {
        id: 'p1',
        title: 'Override Process',
        duration: '15s',
        requireItems: [],
        consumeItems: [],
        createItems: [],
        custom: true,
    };

    const { getByText, queryByText } = render(Process, {
        processId: 'p1',
        processData: customOverride,
    });

    await tick();
    expect(getByText('Override Process')).toBeTruthy();
    expect(
        getByText('Custom processes are displayed for reference and managed separately.')
    ).toBeTruthy();
    expect(queryByText('Start')).toBeNull();
});

test('renders fallback message when process details are unavailable', async () => {
    const { getByText } = render(Process, { processId: 'missing-process' });

    await tick();
    expect(getByText('Process details unavailable.')).toBeTruthy();
});
