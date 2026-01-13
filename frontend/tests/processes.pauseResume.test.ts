import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import {
    getProcessStartedAt,
    getProcessState,
    pauseProcess,
    ProcessStates,
    resumeProcess,
    startProcess,
} from '../src/utils/gameState/processes.js';

const gameStateRef = vi.hoisted(() => ({ value: { processes: {} } }));

vi.mock('../src/utils/gameState/common.js', () => ({
    loadGameState: () => gameStateRef.value,
    saveGameState: (nextState) => {
        gameStateRef.value = nextState;
    },
}));

vi.mock('../src/utils/gameState/inventory.js', () => ({
    hasItems: () => true,
    burnItems: () => {},
    addItems: () => {},
}));

vi.mock('../src/generated/processes.json', () => ({
    default: [
        {
            id: 'process-1',
            title: 'Test Process',
            duration: '10s',
            requireItems: [],
            consumeItems: [],
            createItems: [],
        },
    ],
}));

beforeEach(() => {
    gameStateRef.value = { processes: {} };
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-13T00:00:00Z'));
});

afterEach(() => {
    vi.useRealTimers();
});

test('pauses and resumes without resetting elapsed progress', () => {
    startProcess('process-1');

    vi.advanceTimersByTime(2500);
    const inProgress = getProcessState('process-1');
    expect(inProgress.state).toBe(ProcessStates.IN_PROGRESS);
    expect(inProgress.progress).toBeCloseTo(25, 1);

    pauseProcess('process-1');
    const paused = getProcessState('process-1');
    expect(paused.state).toBe(ProcessStates.PAUSED);
    expect(paused.progress).toBeCloseTo(25, 1);

    vi.advanceTimersByTime(5000);
    const stillPaused = getProcessState('process-1');
    expect(stillPaused.state).toBe(ProcessStates.PAUSED);
    expect(stillPaused.progress).toBeCloseTo(paused.progress, 3);

    resumeProcess('process-1');
    const resumedStart = getProcessStartedAt('process-1');
    expect(resumedStart).toBe(Date.now() - 2500);

    vi.advanceTimersByTime(1000);
    const resumed = getProcessState('process-1');
    expect(resumed.state).toBe(ProcessStates.IN_PROGRESS);
    expect(resumed.progress).toBeCloseTo(35, 1);
});

test('avoids double-counting legacy paused processes', () => {
    const baseTime = Date.now();
    gameStateRef.value = {
        processes: {
            'process-1': {
                startedAt: baseTime - 2500,
                duration: 10000,
                pausedAt: baseTime,
                elapsedBeforePause: 2500,
            },
        },
    };

    const paused = getProcessState('process-1');
    expect(paused.state).toBe(ProcessStates.PAUSED);
    expect(paused.progress).toBeCloseTo(25, 1);
});
