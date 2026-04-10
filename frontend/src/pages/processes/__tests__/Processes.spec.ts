import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Processes from '../Processes.svelte';

const { customListMock, getItemMapMock } = vi.hoisted(() => ({
    customListMock: vi.fn(),
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
        getItemMapMock.mockImplementation(async (ids = []) => {
            const map = new Map();
            ids.forEach((id) => {
                map.set(String(id), {
                    id: String(id),
                    name: `Item ${id}`,
                    image: `/img/${id}.png`,
                    releaseImage: null,
                });
            });
            return map;
        });
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

    it('loads lightweight item previews for requires, consumes, and creates', async () => {
        customListMock.mockResolvedValue([]);
        render(Processes, {
            props: {
                builtInProcesses: [
                    {
                        id: 'preview-process',
                        title: 'Preview Process',
                        duration: '5s',
                        requireItemTypes: 1,
                        requireItemTotal: 1,
                        consumeItemTypes: 1,
                        consumeItemTotal: 2,
                        createItemTypes: 1,
                        createItemTotal: 3,
                        requireItems: [{ id: 'req-item', count: 1 }],
                        consumeItems: [{ id: 'con-item', count: 2 }],
                        createItems: [{ id: 'crt-item', count: 3 }],
                    },
                ],
            },
        });

        expect(await screen.findByText('Item req-item (1)')).toBeTruthy();
        expect(screen.getByText('Item con-item (2)')).toBeTruthy();
        expect(screen.getByText('Item crt-item (3)')).toBeTruthy();
        expect(getItemMapMock).toHaveBeenCalled();
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
