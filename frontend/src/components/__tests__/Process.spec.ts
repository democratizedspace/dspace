import { render, fireEvent } from '@testing-library/svelte';
import Process from '../svelte/Process.svelte';
import { vi } from 'vitest';
import { tick } from 'svelte';

const ProcessStates = {
    NOT_STARTED: 'not started',
    IN_PROGRESS: 'in progress',
    FINISHED: 'finished',
    PAUSED: 'paused',
};

const stateInfo = { state: ProcessStates.IN_PROGRESS, progress: 0 };

const pauseProcess = vi.fn(() => {
    stateInfo.state = ProcessStates.PAUSED;
});
const resumeProcess = vi.fn(() => {
    stateInfo.state = ProcessStates.IN_PROGRESS;
});

vi.mock('../../pages/processes/json', () => ({
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

test('pauses and resumes a process', async () => {
    const { getByText } = render(Process, { processId: 'p1' });

    // pause the process
    await fireEvent.click(getByText('Pause'));
    expect(pauseProcess).toHaveBeenCalledWith('p1');
    await tick();

    // resume the process
    await fireEvent.click(getByText('Resume'));
    expect(resumeProcess).toHaveBeenCalledWith('p1');
});
