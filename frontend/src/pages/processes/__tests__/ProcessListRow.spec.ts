import { render } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import ProcessListRow from '../ProcessListRow.svelte';

describe('ProcessListRow', () => {
    test('renders item preview metadata for requires, consumes, and creates entries', () => {
        const metadataMap = new Map([
            ['smart-plug', { id: 'smart-plug', name: 'Smart Plug', image: '/smart-plug.png' }],
            ['dusd', { id: 'dusd', name: 'dUSD', image: '/dusd.png' }],
            ['dwatt', { id: 'dwatt', name: 'dWatt', image: '/dwatt.png' }],
        ]);

        const process = {
            id: 'buy-electricity',
            title: 'Buy electricity',
            duration: '5s',
            requireItemTypes: 1,
            requireItemTotal: 1,
            consumeItemTypes: 1,
            consumeItemTotal: 0.18,
            createItemTypes: 1,
            createItemTotal: 1000,
            requirePreviewEntries: [{ id: 'smart-plug', count: 1 }],
            consumePreviewEntries: [{ id: 'dusd', count: 0.18 }],
            createPreviewEntries: [{ id: 'dwatt', count: 1000 }],
        };

        const { container, getAllByRole } = render(ProcessListRow, {
            props: { process, itemMetadataMap: metadataMap },
        });

        expect(container.textContent).toContain('1x Smart Plug');
        expect(container.textContent).toContain('0.18x dUSD');
        expect(container.textContent).toContain('1000x dWatt');
        expect(getAllByRole('img')).toHaveLength(3);
    });

    test('leaves preview item names blank when metadata is still loading', () => {
        const process = {
            id: 'process-with-missing-item',
            title: 'Missing item metadata',
            duration: '1s',
            requireItemTypes: 1,
            requireItemTotal: 1,
            consumeItemTypes: 0,
            consumeItemTotal: 0,
            createItemTypes: 0,
            createItemTotal: 0,
            requirePreviewEntries: [{ id: 'unknown-item', count: 2 }],
            consumePreviewEntries: [],
            createPreviewEntries: [],
        };

        const { getByText, getByTestId } = render(ProcessListRow, {
            props: { process, itemMetadataMap: new Map() },
        });

        expect(getByText('Duration')).toBeTruthy();
        expect(getByText('1 item (1)')).toBeTruthy();
        expect(getByText('2x', { exact: false })).toBeTruthy();
        expect(getByTestId('preview-item-name').textContent).toBe('');
    });

    test('does not render preview images before metadata is available', () => {
        const process = {
            id: 'process-with-untrusted-image',
            title: 'Untrusted image',
            duration: '1s',
            requireItemTypes: 1,
            requireItemTotal: 1,
            consumeItemTypes: 0,
            consumeItemTotal: 0,
            createItemTypes: 0,
            createItemTotal: 0,
            requirePreviewEntries: [
                { id: 'unknown-item', count: 1, image: 'data:image/svg+xml,<svg></svg>' },
            ],
            consumePreviewEntries: [],
            createPreviewEntries: [],
        };

        const { container, queryByRole } = render(ProcessListRow, {
            props: { process, itemMetadataMap: new Map() },
        });

        expect(queryByRole('img')).toBeNull();
        expect(container.querySelector('.preview-icon-placeholder')).toBeTruthy();
    });

    test('updates preview lines when metadata map changes after mount', async () => {
        const process = {
            id: 'delayed-metadata',
            title: 'Delayed metadata',
            duration: '1s',
            requireItemTypes: 1,
            requireItemTotal: 1,
            consumeItemTypes: 0,
            consumeItemTotal: 0,
            createItemTypes: 0,
            createItemTotal: 0,
            requirePreviewEntries: [{ id: 'smart-plug', count: 1 }],
            consumePreviewEntries: [],
            createPreviewEntries: [],
        };

        const { container, getByText, rerender } = render(ProcessListRow, {
            props: { process, itemMetadataMap: new Map() },
        });

        expect(getByText('1x', { exact: false })).toBeTruthy();
        expect(container.textContent).not.toContain('1x Smart Plug');

        await rerender({
            process,
            itemMetadataMap: new Map([
                ['smart-plug', { id: 'smart-plug', name: 'Smart Plug', image: '/smart-plug.png' }],
            ]),
        });

        expect(container.textContent).toContain('1x Smart Plug');
    });
});
