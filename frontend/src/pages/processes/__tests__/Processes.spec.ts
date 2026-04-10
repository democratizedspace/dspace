import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Processes from '../Processes.svelte';

const { customListMock } = vi.hoisted(() => ({
    customListMock: vi.fn(),
}));

const { getItemMapMock } = vi.hoisted(() => ({
    getItemMapMock: vi.fn(),
}));

vi.mock('../../../utils/customcontent.js', () => ({
    db: {
        list: customListMock,
    },
    ENTITY_TYPES: {
        PROCESS: 'process',
    },
}));

vi.mock('../../../utils/itemResolver.js', () => ({
    getItemMap: getItemMapMock,
}));

describe('Processes list route contract', () => {
    const builtInProcesses = [
        {
            id: 'built-in-1',
            title: 'Built In Process',
            duration: '10m',
            requireItems: [{ id: 'plug', count: 1 }],
            consumeItems: [{ id: 'dusd', count: 0.18 }],
            createItems: [{ id: 'dwatt', count: 1000 }],
            requireItemTypes: 1,
            requireItemTotal: 1,
            consumeItemTypes: 1,
            consumeItemTotal: 2,
            createItemTypes: 1,
            createItemTotal: 3,
            custom: false,
        },
    ];

    beforeEach(() => {
        customListMock.mockReset();
        getItemMapMock.mockReset();
        getItemMapMock.mockResolvedValue(
            new Map([
                ['plug', { id: 'plug', name: 'Smart Plug', image: '/plug.png' }],
                ['dusd', { id: 'dusd', name: 'dUSD', image: '/dusd.png' }],
                ['dwatt', { id: 'dwatt', name: 'dWatt', image: '/dwatt.png' }],
            ])
        );
    });

    it('renders built-in summary rows from initial output before custom merge resolves', () => {
        let resolveCustomProcesses;
        const pendingCustomProcesses = new Promise((resolve) => {
            resolveCustomProcesses = resolve;
        });
        customListMock.mockReturnValue(pendingCustomProcesses);

        render(Processes, { props: { builtInProcesses } });

        expect(screen.getByText('Built In Process')).toBeTruthy();
        expect(screen.getByText('Duration')).toBeTruthy();
        expect(screen.queryByText('No processes found')).toBeNull();

        resolveCustomProcesses([]);
    });

    it('keeps list route summary-only without detail runtime controls', () => {
        customListMock.mockResolvedValue([]);
        render(Processes, { props: { builtInProcesses } });

        for (const control of ['Buy required items', 'Start', 'Pause', 'Resume', 'Collect']) {
            expect(screen.queryByRole('button', { name: control })).toBeNull();
        }
    });

    it('keeps create and manage navigation affordances on the list route', () => {
        customListMock.mockResolvedValue([]);
        render(Processes, { props: { builtInProcesses } });

        expect(
            screen.getByRole('link', { name: 'Create a new process' }).getAttribute('href')
        ).toBe('/processes/create');
        expect(screen.getByRole('link', { name: 'Manage processes' }).getAttribute('href')).toBe(
            '/processes/manage'
        );
        expect(screen.getByRole('link', { name: 'View details' }).getAttribute('href')).toBe(
            '/processes/built-in-1'
        );
    });

    it('renders lightweight metadata previews for process entries', async () => {
        customListMock.mockResolvedValue([]);
        render(Processes, { props: { builtInProcesses } });

        expect(await screen.findByText('1 × Smart Plug')).toBeTruthy();
        expect(screen.getByText('0.18 × dUSD')).toBeTruthy();
        expect(screen.getByText('1000 × dWatt')).toBeTruthy();
    });

    it('merges custom processes asynchronously after mount', async () => {
        customListMock.mockResolvedValue([
            {
                id: 'custom-1',
                title: 'Custom Process',
                duration: '20m',
                custom: true,
                requireItems: [],
                consumeItems: [],
                createItems: [],
            },
        ]);

        render(Processes, { props: { builtInProcesses } });

        expect(await screen.findByText('Custom Process')).toBeTruthy();
        expect(screen.getByText('Custom')).toBeTruthy();

        const detailLinks = screen.getAllByRole('link', { name: 'View details' });
        expect(detailLinks.length).toBe(2);
        expect(detailLinks[1].getAttribute('href')).toBe('/processes/custom-1');
    });

    it('de-dupes by normalized id and keeps built-ins when custom ids collide', async () => {
        customListMock.mockResolvedValue([
            {
                id: ' built-in-1 ',
                title: 'Overriding Custom Process',
                duration: '99m',
                custom: true,
                requireItems: [],
                consumeItems: [],
                createItems: [],
            },
        ]);

        render(Processes, { props: { builtInProcesses } });

        await screen.findByText('Built In Process');
        expect(screen.queryByText('Overriding Custom Process')).toBeNull();
        expect(screen.getAllByRole('link', { name: 'View details' })).toHaveLength(1);
    });
});
