import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import {
    getProcessStartedAt,
    getProcessState,
    pauseProcess,
    ProcessStates,
    resumeProcess,
    startProcess,
} from '../processes.js';

const loadGameStateMock = vi.hoisted(() => vi.fn());
const saveGameStateMock = vi.hoisted(() => vi.fn());
const hasItemsMock = vi.hoisted(() => vi.fn(() => true));
const burnItemsMock = vi.hoisted(() => vi.fn());
const addItemsMock = vi.hoisted(() => vi.fn());

const gameState = { processes: {} } as { processes: Record<string, any> };

vi.mock('../common.js', () => ({
    loadGameState: (...args: unknown[]) => loadGameStateMock(...args),
    saveGameState: (...args: unknown[]) => saveGameStateMock(...args),
}));

vi.mock('../inventory.js', () => ({
    hasItems: (...args: unknown[]) => hasItemsMock(...args),
    burnItems: (...args: unknown[]) => burnItemsMock(...args),
    addItems: (...args: unknown[]) => addItemsMock(...args),
}));

vi.mock('../../generated/processes.json', () => ({
    default: [
        {
            id: 'test-process',
            title: 'Test Process',
            duration: '10s',
            requireItems: [],
            consumeItems: [],
            createItems: [],
        },
    ],
}));

beforeEach(() => {
    gameState.processes = {};
    loadGameStateMock.mockReturnValue(gameState);
    saveGameStateMock.mockClear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-13T00:00:00Z'));
});

afterEach(() => {
    vi.useRealTimers();
});

test('pauses and resumes without resetting progress', () => {
    const baseTime = Date.now();

    startProcess('test-process');

    vi.advanceTimersByTime(2500);
    let state = getProcessState('test-process');
    expect(state.state).toBe(ProcessStates.IN_PROGRESS);
    expect(state.progress).toBeCloseTo(25, 1);

    pauseProcess('test-process');
    state = getProcessState('test-process');
    const pausedProgress = state.progress;
    expect(state.state).toBe(ProcessStates.PAUSED);

    vi.advanceTimersByTime(5000);
    state = getProcessState('test-process');
    expect(state.state).toBe(ProcessStates.PAUSED);
    expect(state.progress).toBeCloseTo(pausedProgress, 3);

    resumeProcess('test-process');
    state = getProcessState('test-process');
    expect(state.state).toBe(ProcessStates.IN_PROGRESS);

    const effectiveStart = getProcessStartedAt('test-process');
    expect(effectiveStart).toBe(baseTime + 5000);

    vi.advanceTimersByTime(1000);
    state = getProcessState('test-process');
    expect(state.progress).toBeCloseTo(35, 1);
});

test('avoids double-counting elapsed time for legacy paused records', () => {
    const baseTime = Date.now();
    gameState.processes['legacy-process'] = {
        startedAt: baseTime,
        duration: 10000,
        pausedAt: baseTime + 2000,
        elapsedBeforePause: 2000,
    };

    let state = getProcessState('legacy-process');
    expect(state.state).toBe(ProcessStates.PAUSED);
    expect(state.progress).toBeCloseTo(20, 1);

    vi.setSystemTime(new Date(baseTime + 3000));
    resumeProcess('legacy-process');

    const resumed = gameState.processes['legacy-process'];
    expect(resumed.elapsedBeforePause).toBe(2000);
    expect(resumed.pausedAt).toBeNull();
    expect(resumed.startedAt).toBe(baseTime + 3000);
    expect(resumed.pauseModelVersion).toBe(2);
});
