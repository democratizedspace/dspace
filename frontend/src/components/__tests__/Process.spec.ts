import { render, fireEvent, waitFor } from '@testing-library/svelte';
import Process from '../svelte/Process.svelte';
import { vi, expect, test, beforeEach, afterEach } from 'vitest';
import { tick } from 'svelte';
import { writable } from 'svelte/store';
import { getProcessState as getProcessStateMock } from '../../utils/gameState/processes.js';

const ProcessStates = vi.hoisted(() => ({
    NOT_STARTED: 'not started',
    IN_PROGRESS: 'in progress',
    FINISHED: 'finished',
    PAUSED: 'paused',
}));

const stateInfo = vi.hoisted(() => ({ state: ProcessStates.IN_PROGRESS, progress: 0 }));
const getItemCountsMock = vi.hoisted(() => vi.fn(() => ({ 'item-1': 0 })));
const getItemMapMock = vi.hoisted(() => vi.fn());
const getProcessStartedAtMock = vi.hoisted(() => vi.fn(() => Date.now()));
const cheatsAvailabilityStore = writable(false);
const cheatsEnabledStore = writable(false);
const finishProcessNow = vi.hoisted(() => vi.fn());
const startProcess = vi.hoisted(() => vi.fn(() => true));
const getItemCountOperationStartError = vi.hoisted(() => vi.fn(() => ''));
const dbGetMock = vi.hoisted(() => vi.fn<(entityType: string, id: string) => Promise<unknown>>());

const getProcessState = vi.mocked(getProcessStateMock);

vi.mock('../../pages/inventory/json/items', () => ({
    default: [
        {
            id: 'item-1',
            name: 'Test Item',
            image: '/test.png',
        },
        {
            id: 'item-2',
            name: 'Second Item',
            image: '/test.png',
        },
        {
            id: 'item-3',
            name: 'Third Item',
            image: '/test.png',
        },
        {
            id: 'item-4',
            name: 'Fourth Item',
            image: '/test.png',
        },
    ],
}));

vi.mock('../../utils/gameState/inventory.js', () => ({
    getItemCounts: (...args: unknown[]) => getItemCountsMock(...args),
}));

vi.mock('../../utils/itemResolver.js', () => ({
    getItemMap: (...args: unknown[]) => getItemMapMock(...args),
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
    startProcess,
    getItemCountOperationStartError,
    cancelProcess: vi.fn(),
    finishProcess: vi.fn(),
    getProcessState: vi.fn(() => stateInfo),
    ProcessStates,
    getProcessStartedAt: (...args: unknown[]) => getProcessStartedAtMock(...args),
    pauseProcess,
    resumeProcess,
    finishProcessNow,
}));

vi.mock('../../lib/qaCheats', () => ({
    qaCheatsAvailability: {
        subscribe: (...args: unknown[]) => cheatsAvailabilityStore.subscribe(...args),
    },
    qaCheatsEnabled: {
        subscribe: (...args: unknown[]) => cheatsEnabledStore.subscribe(...args),
    },
    initializeQaCheats: vi.fn(),
}));

vi.mock('../../utils/customcontent.js', () => ({
    db: {
        get: (entityType: string, id: string) => dbGetMock(entityType, id),
    },
    ENTITY_TYPES: {
        PROCESS: 'process',
    },
}));

beforeEach(() => {
    cheatsAvailabilityStore.set(false);
    cheatsEnabledStore.set(false);
    stateInfo.state = ProcessStates.IN_PROGRESS;
    getProcessState.mockReturnValue(stateInfo);
    finishProcessNow.mockClear();
    getProcessStartedAtMock.mockReset();
    getProcessStartedAtMock.mockImplementation(() => Date.now());
    startProcess.mockClear();
    getItemCountOperationStartError.mockReset();
    getItemCountOperationStartError.mockReturnValue('');
    dbGetMock.mockReset();
    getItemMapMock.mockResolvedValue(
        new Map([
            ['item-1', { id: 'item-1', name: 'Test Item', image: '/test.png', releaseImage: null }],
            [
                'item-2',
                { id: 'item-2', name: 'Second Item', image: '/test.png', releaseImage: null },
            ],
            [
                'item-3',
                { id: 'item-3', name: 'Third Item', image: '/test.png', releaseImage: null },
            ],
            [
                'item-4',
                { id: 'item-4', name: 'Fourth Item', image: '/test.png', releaseImage: null },
            ],
        ])
    );
});

afterEach(() => {
    vi.useRealTimers();
});

test('pauses and resumes a process while showing remaining time', async () => {
    vi.useFakeTimers();
    const fixedStart = new Date('2026-01-13T00:00:00.000Z').getTime();
    getProcessStartedAtMock.mockReturnValue(fixedStart);
    vi.setSystemTime(fixedStart);

    const { getByText } = render(Process, { processId: 'p1' });

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
    vi.advanceTimersByTime(1000);
    await tick();
    expect(getByText(/remaining/).textContent).not.toBe(pausedRemaining);
});

test('shows required items even when counts are zero', async () => {
    getItemCountsMock.mockReturnValue({ 'item-1': 0 });

    const { getByText } = render(Process, { processId: 'p2' });

    await waitFor(() => {
        const requireSection = getByText('Requires:').parentElement;
        const normalizedText = requireSection?.textContent?.replace(/\s+/g, ' ');

        expect(normalizedText).toContain('Requires:');
        expect(normalizedText).toMatch(/2\s*\/\s*0/);
        expect(normalizedText).toMatch(/Test Item/);
        expect(normalizedText).not.toMatch(/0\s*\/\s*2/);
    });
});

test('shows missing requirement feedback with singular "more" label', async () => {
    stateInfo.state = ProcessStates.NOT_STARTED;
    getProcessState.mockReturnValue({ state: ProcessStates.NOT_STARTED, progress: 0 });
    getItemCountsMock.mockReturnValue({ 'item-1': 0, 'item-2': 0, 'item-3': 0 });

    const customProcess = {
        id: 'custom-2',
        title: 'Missing Requirements',
        duration: '5s',
        requireItems: [
            { id: 'item-1', count: 1 },
            { id: 'item-2', count: 1 },
            { id: 'item-3', count: 1 },
        ],
        consumeItems: [],
        createItems: [],
        custom: true,
    };

    const { getByTestId } = render(Process, {
        processId: 'custom-2',
        processData: customProcess,
    });

    await tick();
    await fireEvent.click(getByTestId('process-start-button'));

    const feedback = getByTestId('process-start-feedback');
    expect(feedback.textContent).toContain('and 1 more');
    expect(startProcess).not.toHaveBeenCalled();
});

test('shows missing requirement feedback with plural "more items" label', async () => {
    stateInfo.state = ProcessStates.NOT_STARTED;
    getProcessState.mockReturnValue({ state: ProcessStates.NOT_STARTED, progress: 0 });
    getItemCountsMock.mockReturnValue({
        'item-1': 0,
        'item-2': 0,
        'item-3': 0,
        'item-4': 0,
    });

    const customProcess = {
        id: 'custom-3',
        title: 'Missing Requirements Plural',
        duration: '5s',
        requireItems: [
            { id: 'item-1', count: 1 },
            { id: 'item-2', count: 1 },
            { id: 'item-3', count: 1 },
            { id: 'item-4', count: 1 },
        ],
        consumeItems: [],
        createItems: [],
        custom: true,
    };

    const { getByTestId } = render(Process, {
        processId: 'custom-3',
        processData: customProcess,
    });

    await tick();
    await fireEvent.click(getByTestId('process-start-button'));

    const feedback = getByTestId('process-start-feedback');
    expect(feedback.textContent).toContain('and 2 more items');
    expect(startProcess).not.toHaveBeenCalled();
});

test('alternates process chip contrast between parent container and item groups', async () => {
    stateInfo.state = ProcessStates.NOT_STARTED;
    getProcessState.mockReturnValue({ state: ProcessStates.NOT_STARTED, progress: 0 });
    getItemCountsMock.mockReturnValue({ 'item-1': 3 });

    const customProcess = {
        id: 'custom-contrast',
        title: 'Contrast Check',
        duration: '5s',
        requireItems: [{ id: 'item-1', count: 1 }],
        consumeItems: [],
        createItems: [],
        custom: true,
    };

    const { getByTestId } = render(Process, {
        processId: 'custom-contrast',
        processData: customProcess,
        inverted: true,
    });

    await waitFor(() => {
        expect(getByTestId('process-requires')).toBeTruthy();
    });

    const processChip = getByTestId('process-chip');
    const requiresChip =
        getByTestId('process-requires').querySelector('nav .chip-container.static-container');

    expect(processChip.classList.contains('inverted')).toBe(true);
    expect(requiresChip?.classList.contains('inverted')).toBe(false);
});

test('shows missing requirement feedback when two items are missing', async () => {
    stateInfo.state = ProcessStates.NOT_STARTED;
    getProcessState.mockReturnValue({ state: ProcessStates.NOT_STARTED, progress: 0 });
    getItemCountsMock.mockReturnValue({ 'item-1': 0, 'item-2': 0 });

    const customProcess = {
        id: 'custom-4',
        title: 'Missing Two Requirements',
        duration: '5s',
        requireItems: [
            { id: 'item-1', count: 1 },
            { id: 'item-2', count: 1 },
        ],
        consumeItems: [],
        createItems: [],
        custom: true,
    };

    const { getByTestId } = render(Process, {
        processId: 'custom-4',
        processData: customProcess,
    });

    await tick();
    await fireEvent.click(getByTestId('process-start-button'));

    const feedback = getByTestId('process-start-feedback');
    expect(feedback.textContent).toContain('Missing requirements: Test Item (1), Second Item (1)');
    expect(startProcess).not.toHaveBeenCalled();
});

test('merges missing requirement entries across require and consume lists', async () => {
    stateInfo.state = ProcessStates.NOT_STARTED;
    getProcessState.mockReturnValue({ state: ProcessStates.NOT_STARTED, progress: 0 });
    getItemCountsMock.mockReturnValue({ 'item-1': 0 });

    const customProcess = {
        id: 'custom-merge',
        title: 'Merged Requirements',
        duration: '5s',
        requireItems: [{ id: 'item-1', count: 1 }],
        consumeItems: [{ id: 'item-1', count: 3 }],
        createItems: [],
        custom: true,
    };

    const { getByTestId } = render(Process, {
        processId: 'custom-merge',
        processData: customProcess,
    });

    await tick();
    await fireEvent.click(getByTestId('process-start-button'));

    const feedback = getByTestId('process-start-feedback');
    expect(feedback.textContent).toContain('Missing requirements: Test Item (3)');
    expect(startProcess).not.toHaveBeenCalled();
});

test('scrolls missing requirements into view when not fully visible', async () => {
    stateInfo.state = ProcessStates.NOT_STARTED;
    getProcessState.mockReturnValue({ state: ProcessStates.NOT_STARTED, progress: 0 });
    getItemCountsMock.mockReturnValue({ 'item-1': 0 });

    const customProcess = {
        id: 'custom-scroll',
        title: 'Scroll Requirements',
        duration: '5s',
        requireItems: [{ id: 'item-1', count: 1 }],
        consumeItems: [],
        createItems: [],
        custom: true,
    };

    const originalInnerHeight = window.innerHeight;
    const originalInnerWidth = window.innerWidth;
    Object.defineProperty(window, 'innerHeight', { value: 100, configurable: true });
    Object.defineProperty(window, 'innerWidth', { value: 100, configurable: true });

    const { getByTestId } = render(Process, {
        processId: 'custom-scroll',
        processData: customProcess,
    });

    await tick();
    const requiresContainer = getByTestId('process-requires');
    const scrollSpy = vi.fn();
    requiresContainer.scrollIntoView = scrollSpy;
    requiresContainer.getBoundingClientRect = () =>
        ({
            top: -10,
            left: 0,
            bottom: 150,
            right: 50,
        }) as DOMRect;

    await fireEvent.click(getByTestId('process-start-button'));

    await waitFor(() => {
        expect(scrollSpy).toHaveBeenCalled();
    });

    Object.defineProperty(window, 'innerHeight', {
        value: originalInnerHeight,
        configurable: true,
    });
    Object.defineProperty(window, 'innerWidth', {
        value: originalInnerWidth,
        configurable: true,
    });
});

test('renders instant finish chip when cheats are enabled', async () => {
    cheatsAvailabilityStore.set(true);
    cheatsEnabledStore.set(true);

    const { getByTestId } = render(Process, { processId: 'p1' });

    await tick();
    const chip = getByTestId('qa-instant-finish-chip');
    expect(chip).toBeTruthy();

    await fireEvent.click(chip);
    expect(finishProcessNow).toHaveBeenCalledWith(
        'p1',
        expect.objectContaining({
            id: 'p1',
            title: 'Test Process',
        })
    );
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
    expect(finishProcessNow).toHaveBeenCalledWith(
        'p1',
        expect.objectContaining({
            id: 'p1',
            title: 'Test Process',
        })
    );
});

test('renders custom process start controls when rendering a custom process', async () => {
    stateInfo.state = ProcessStates.NOT_STARTED;
    getProcessState.mockReturnValue({ state: ProcessStates.NOT_STARTED, progress: 0 });
    const customProcess = {
        id: 'custom-1',
        title: 'Custom Process',
        duration: '5s',
        requireItems: [],
        consumeItems: [],
        createItems: [],
        custom: true,
    };

    const { getByText, getByTestId } = render(Process, {
        processId: 'custom-1',
        processData: customProcess,
    });

    await tick();
    expect(getByText('Duration: 5s')).toBeTruthy();
    const startButton = getByTestId('process-start-button');
    expect(startButton).toBeTruthy();
    await fireEvent.click(startButton);
    expect(startProcess).toHaveBeenCalledWith('custom-1', customProcess);
});

test('shows start feedback when container-operation validation fails', async () => {
    stateInfo.state = ProcessStates.NOT_STARTED;
    getProcessState.mockReturnValue({ state: ProcessStates.NOT_STARTED, progress: 0 });
    getItemCountOperationStartError.mockReturnValue('Cannot start yet: test error');

    const customProcess = {
        id: 'custom-start-error',
        title: 'Start Error Process',
        duration: '5s',
        requireItems: [],
        consumeItems: [],
        createItems: [],
        itemCountOperations: [
            {
                operation: 'deposit',
                containerItemId: 'container-1',
                itemId: 'item-1',
                count: 1,
            },
        ],
        custom: true,
    };

    const { getByTestId } = render(Process, {
        processId: 'custom-start-error',
        processData: customProcess,
    });

    await tick();
    await fireEvent.click(getByTestId('process-start-button'));

    expect(startProcess).not.toHaveBeenCalled();
    expect(getByTestId('process-start-feedback').textContent).toContain(
        'Cannot start yet: test error'
    );
});

test('prefers provided process data over built-in catalog lookup', async () => {
    stateInfo.state = ProcessStates.NOT_STARTED;
    getProcessState.mockReturnValue({ state: ProcessStates.NOT_STARTED, progress: 0 });
    const customOverride = {
        id: 'p1',
        title: 'Override Process',
        duration: '15s',
        requireItems: [],
        consumeItems: [],
        createItems: [],
        custom: true,
    };

    const { getByText } = render(Process, {
        processId: 'p1',
        processData: customOverride,
    });

    await tick();
    expect(getByText('Override Process')).toBeTruthy();
    expect(getByText('Start')).toBeTruthy();
});

test('renders fallback message when process details are unavailable', async () => {
    const { getByText } = render(Process, { processId: 'missing-process' });

    await tick();
    expect(getByText('Unknown process.')).toBeTruthy();
});

test('loads custom process definitions when missing from the built-in catalog', async () => {
    stateInfo.state = ProcessStates.NOT_STARTED;
    getProcessState.mockReturnValue({ state: ProcessStates.NOT_STARTED, progress: 0 });

    const customProcess = {
        id: 'custom-missing',
        title: 'IndexedDB Process',
        duration: '15s',
        requireItems: [],
        consumeItems: [],
        createItems: [],
        custom: true,
    };

    dbGetMock.mockResolvedValue(customProcess);

    const { findByText } = render(Process, { processId: 'custom-missing' });

    await findByText('IndexedDB Process');
    expect(dbGetMock).toHaveBeenCalledWith('process', 'custom-missing');
});

test('keeps fallback UI when custom process lookup fails', async () => {
    stateInfo.state = ProcessStates.NOT_STARTED;
    getProcessState.mockReturnValue({ state: ProcessStates.NOT_STARTED, progress: 0 });
    dbGetMock.mockRejectedValueOnce(new Error('Lookup failed'));

    const { getByText } = render(Process, { processId: 'missing-custom' });

    await waitFor(() => {
        expect(dbGetMock).toHaveBeenCalledWith('process', 'missing-custom');
    });

    await waitFor(() => {
        expect(getByText('Unknown process.')).toBeTruthy();
    });
});
