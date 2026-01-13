/**
 * @jest-environment jsdom
 */
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import Process from '../src/components/svelte/Process.svelte';

const mockState = { state: 'not started', progress: 0 };

vi.mock('../src/utils/gameState/processes.js', async () => {
    const actual = await vi.importActual('../src/utils/gameState/processes.js');
    return {
        ...actual,
        startProcess: vi.fn(),
        cancelProcess: vi.fn(),
        finishProcess: vi.fn(),
        pauseProcess: vi.fn(),
        resumeProcess: vi.fn(),
        getProcessState: vi.fn(() => mockState),
        getProcessStartedAt: vi.fn(() => Date.now()),
    };
});

describe('Process component custom data', () => {
    it('renders custom process details with standard controls', () => {
        const customProcess = {
            id: 'custom-process-1',
            title: 'Custom Habitat Cycle',
            duration: '45m',
            requireItems: [{ id: 'item-1', count: 1 }],
            consumeItems: [{ id: 'item-2', count: 2 }],
            createItems: [{ id: 'item-3', count: 1 }],
            custom: true,
        };

        const { getByText, queryByText } = render(Process, {
            props: { processId: customProcess.id, processData: customProcess },
        });

        getByText('Custom Habitat Cycle');
        getByText('Duration: 45m');
        expect(queryByText('Custom processes are displayed for reference and managed separately.'))
            .toBeNull();
        expect(queryByText('Start')).not.toBeNull();
        expect(queryByText('Collect')).toBeNull();
    });
});
