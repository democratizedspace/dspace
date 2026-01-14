import { beforeEach, afterEach, describe, expect, test, vi } from 'vitest';
import {
    getProcessProgress,
    getProcessStartedAt,
    getProcessState,
    pauseProcess,
    resumeProcess,
    startProcess,
} from '../processes.js';

const loadGameStateMock = vi.hoisted(() => vi.fn());
const saveGameStateMock = vi.hoisted(() => vi.fn());

vi.mock('../common.js', () => ({
    loadGameState: (...args: unknown[]) => loadGameStateMock(...args),
    saveGameState: (...args: unknown[]) => saveGameStateMock(...args),
}));

vi.mock('../../../generated/processes.json', () => ({
    default: [
        {
            id: 'p1',
            title: 'Test Process',
            duration: '10s',
            requireItems: [],
            consumeItems: [],
            createItems: [],
        },
    ],
}));

const baseTime = new Date('2026-01-13T00:00:00.000Z');

describe('process pause/resume timing', () => {
    type ProcessRecord = {
        startedAt?: number;
        duration?: number;
        pausedAt?: number | null;
        elapsedBeforePause?: number;
        pauseModelVersion?: number;
    };
    type GameState = { processes: Record<string, ProcessRecord> };

    let gameState: GameState;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(baseTime);
        gameState = { processes: {} };
        loadGameStateMock.mockImplementation(() => gameState);
        saveGameStateMock.mockImplementation((state: GameState) => {
            gameState = state;
        });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    test('pauses and resumes without resetting progress', () => {
        startProcess('p1');

        vi.advanceTimersByTime(2500);
        let state = getProcessState('p1');
        expect(state.state).toBe('in progress');
        expect(state.progress).toBeCloseTo(25, 0);

        pauseProcess('p1');
        state = getProcessState('p1');
        expect(state.state).toBe('paused');

        vi.advanceTimersByTime(5000);
        state = getProcessState('p1');
        expect(state.state).toBe('paused');
        expect(state.progress).toBeCloseTo(25, 0);

        resumeProcess('p1');
        vi.advanceTimersByTime(1000);
        state = getProcessState('p1');
        expect(state.state).toBe('in progress');
        expect(state.progress).toBeCloseTo(35, 0);
    });

    test('computes effective start time for UI continuity', () => {
        startProcess('p1');

        vi.advanceTimersByTime(2500);
        pauseProcess('p1');
        vi.advanceTimersByTime(5000);
        resumeProcess('p1');

        const expectedEffectiveStart = baseTime.getTime() + 5000;
        expect(getProcessStartedAt('p1')).toBe(expectedEffectiveStart);
    });

    test('avoids double-counting legacy paused records', () => {
        gameState.processes.p1 = {
            startedAt: baseTime.getTime(),
            duration: 10000,
            pausedAt: baseTime.getTime() + 3000,
            elapsedBeforePause: 3000,
        };

        const state = getProcessState('p1');
        expect(state.state).toBe('paused');
        expect(state.progress).toBeCloseTo(30, 0);
        expect(getProcessProgress('p1')).toBeCloseTo(30, 0);
    });

    test('treats invalid records as not started', () => {
        gameState.processes.p1 = {
            startedAt: baseTime.getTime(),
            duration: 0,
            pausedAt: null,
            elapsedBeforePause: 0,
        };

        const state = getProcessState('p1');
        expect(state.state).toBe('not started');
        expect(state.progress).toBe(0);
        expect(getProcessStartedAt('p1')).toBeUndefined();
        expect(getProcessProgress('p1')).toBe(0);
    });
});
