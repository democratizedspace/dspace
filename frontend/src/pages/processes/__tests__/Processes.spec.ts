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
        getItemMapMock.mockResolvedValue(new Map());
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

    it('hydrates preview lines on the route list and dedupes metadata fetch ids across sections/processes', async () => {
        customListMock.mockResolvedValue([]);
        getItemMapMock.mockResolvedValue(
            new Map([
                ['shared-item', { id: 'shared-item', name: 'Shared Item', image: '/shared.png' }],
                ['fuel-cell', { id: 'fuel-cell', name: 'Fuel Cell', image: '/fuel.png' }],
                ['byproduct', { id: 'byproduct', name: 'Byproduct', image: '/byproduct.png' }],
            ])
        );

        const routeShapedBuiltIns = [
            {
                id: 'built-in-1',
                title: 'Built In Process',
                duration: '10m',
                requireItemTypes: 1,
                requireItemTotal: 1,
                consumeItemTypes: 2,
                consumeItemTotal: 5,
                createItemTypes: 1,
                createItemTotal: 3,
                requirePreviewEntries: [{ id: 'shared-item', count: 1 }],
                consumePreviewEntries: [
                    { id: 'shared-item', count: 2 },
                    { id: 'fuel-cell', count: 3 },
                ],
                createPreviewEntries: [{ id: 'byproduct', count: 3 }],
                custom: false,
            },
            {
                id: 'built-in-2',
                title: 'Secondary Process',
                duration: '3m',
                requireItemTypes: 1,
                requireItemTotal: 2,
                consumeItemTypes: 0,
                consumeItemTotal: 0,
                createItemTypes: 1,
                createItemTotal: 1,
                requirePreviewEntries: [{ id: 'shared-item', count: 2 }],
                consumePreviewEntries: [],
                createPreviewEntries: [{ id: 'fuel-cell', count: 1 }],
                custom: false,
            },
        ];

        render(Processes, { props: { builtInProcesses: routeShapedBuiltIns } });

        expect(screen.getByText('Built In Process')).toBeTruthy();
        expect(screen.getByText('Secondary Process')).toBeTruthy();
        expect(screen.getAllByText('1 item (1)').length).toBeGreaterThan(0);
        expect(screen.getAllByText('1 item (3)').length).toBeGreaterThan(0);
        expect(screen.queryByRole('button', { name: 'Start' })).toBeNull();
        expect(screen.getAllByRole('link', { name: 'View details' })).toHaveLength(2);

        expect(await screen.findByText('1x Shared Item')).toBeTruthy();
        expect(screen.getByText('3x Fuel Cell')).toBeTruthy();
        expect(screen.getByText('3x Byproduct')).toBeTruthy();

        expect(getItemMapMock).toHaveBeenCalled();
        expect(getItemMapMock.mock.calls[0][0]).toEqual(
            expect.arrayContaining(['shared-item', 'fuel-cell', 'byproduct'])
        );
        expect(new Set(getItemMapMock.mock.calls[0][0]).size).toBe(
            getItemMapMock.mock.calls[0][0].length
        );
    });

    it('uses resolver fallback metadata when a preview entry is missing from the item catalog', async () => {
        customListMock.mockResolvedValue([]);
        getItemMapMock.mockResolvedValue(
            new Map([
                ['known-item', { id: 'known-item', name: 'Known Item', image: '/known.png' }],
                [
                    'missing-item',
                    { id: 'missing-item', name: 'Unknown item', image: '/favicon.ico' },
                ],
            ])
        );

        render(Processes, {
            props: {
                builtInProcesses: [
                    {
                        id: 'built-in-fallback',
                        title: 'Fallback Process',
                        duration: '8m',
                        requireItemTypes: 1,
                        requireItemTotal: 1,
                        consumeItemTypes: 1,
                        consumeItemTotal: 2,
                        createItemTypes: 0,
                        createItemTotal: 0,
                        requirePreviewEntries: [{ id: 'known-item', count: 1 }],
                        consumePreviewEntries: [{ id: 'missing-item', count: 2 }],
                        createPreviewEntries: [],
                        custom: false,
                    },
                ],
            },
        });

        expect(await screen.findByText('1x Known Item')).toBeTruthy();
        expect(screen.getByText('2x Unknown item')).toBeTruthy();
        expect(screen.queryByText('2x missing-item')).toBeNull();
    });

    it('renders list details immediately while waiting for preview metadata to resolve', async () => {
        customListMock.mockResolvedValue([]);
        let resolveMetadata:
            | ((value: Map<string, { id: string; name: string; image: string }>) => void)
            | undefined;
        const metadataPromise = new Promise<
            Map<string, { id: string; name: string; image: string }>
        >((resolve) => {
            resolveMetadata = resolve;
        });
        getItemMapMock.mockReturnValue(metadataPromise);

        render(Processes, {
            props: {
                builtInProcesses: [
                    {
                        id: 'loading-preview-process',
                        title: 'Loading Preview Process',
                        duration: '3m',
                        requireItemTypes: 1,
                        requireItemTotal: 1,
                        consumeItemTypes: 0,
                        consumeItemTotal: 0,
                        createItemTypes: 0,
                        createItemTotal: 0,
                        requirePreviewEntries: [{ id: 'pending-item', count: 1 }],
                        consumePreviewEntries: [],
                        createPreviewEntries: [],
                        custom: false,
                    },
                ],
            },
        });

        expect(screen.getByText('Loading Preview Process')).toBeTruthy();
        expect(screen.getByText('Duration')).toBeTruthy();
        expect(screen.getByText('1 item (1)')).toBeTruthy();
        expect(screen.getByRole('link', { name: 'View details' }).getAttribute('href')).toBe(
            '/processes/loading-preview-process'
        );
        expect(
            screen.getAllByText((content, node) => node?.textContent?.trim() === '1x').length
        ).toBeGreaterThan(0);
        expect(screen.queryByText('1x pending-item')).toBeNull();
        expect(screen.queryByText('1x Pending Item')).toBeNull();

        resolveMetadata?.(
            new Map([
                [
                    'pending-item',
                    { id: 'pending-item', name: 'Pending Item', image: '/pending.png' },
                ],
            ])
        );

        expect(await screen.findByText('1x Pending Item')).toBeTruthy();
        expect(screen.queryByText('1x pending-item')).toBeNull();
    });
});
