import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import {
    getProcessProgress,
    getProcessStartedAt,
    getProcessState,
    pauseProcess,
    ProcessStates,
    resumeProcess,
    startProcess,
} from '../processes.js';

const gameStateStore = vi.hoisted(() => ({ state: { processes: {} } }));
const loadGameState = vi.hoisted(() => vi.fn(() => gameStateStore.state));
const saveGameState = vi.hoisted(() =>
    vi.fn((state) => {
        gameStateStore.state = state;
    })
);

vi.mock('../common.js', () => ({
    loadGameState,
    saveGameState,
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
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-13T00:00:00Z'));
    gameStateStore.state = { processes: {} };
    loadGameState.mockClear();
    saveGameState.mockClear();
});

afterEach(() => {
    vi.useRealTimers();
});

test('pause/resume preserves elapsed progress', () => {
    startProcess('test-process');

    vi.advanceTimersByTime(2500);
    const inProgressState = getProcessState('test-process');
    expect(inProgressState.state).toBe(ProcessStates.IN_PROGRESS);
    expect(inProgressState.progress).toBeCloseTo(25, 1);

    pauseProcess('test-process');
    vi.advanceTimersByTime(5000);
    const pausedState = getProcessState('test-process');
    expect(pausedState.state).toBe(ProcessStates.PAUSED);
    expect(pausedState.progress).toBeCloseTo(25, 1);

    resumeProcess('test-process');
    vi.advanceTimersByTime(1000);
    const resumedState = getProcessState('test-process');
    expect(resumedState.state).toBe(ProcessStates.IN_PROGRESS);
    expect(resumedState.progress).toBeCloseTo(35, 1);
});

test('effective start time remains continuous after resume', () => {
    startProcess('test-process');

    vi.advanceTimersByTime(3000);
    pauseProcess('test-process');
    vi.advanceTimersByTime(2000);
    resumeProcess('test-process');

    const processRecord = gameStateStore.state.processes['test-process'];
    const effectiveStart = getProcessStartedAt('test-process');
    expect(effectiveStart).toBe(processRecord.startedAt - processRecord.elapsedBeforePause);
    expect(getProcessProgress('test-process')).toBeCloseTo(30, 1);
});

test('legacy paused records do not double-count elapsed time', () => {
    const baseTime = Date.now();
    gameStateStore.state.processes['legacy-process'] = {
        startedAt: baseTime,
        duration: 10000,
        pausedAt: baseTime + 2000,
        elapsedBeforePause: 2000,
    };

    const legacyState = getProcessState('legacy-process');
    expect(legacyState.state).toBe(ProcessStates.PAUSED);
    expect(legacyState.progress).toBeCloseTo(20, 1);
});
