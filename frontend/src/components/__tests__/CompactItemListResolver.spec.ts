import { render, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import { describe, expect, test, vi } from 'vitest';

const getItemCountsMock = vi.fn();
const getItemMapMock = vi.fn();
const releaseItemImageUrlsMock = vi.fn();
const isGameStateReadyMock = vi.fn();

vi.mock('../../utils/gameState/inventory.js', () => ({
    getItemCounts: (...args) => getItemCountsMock(...args),
}));

vi.mock('../../utils/gameState/common.js', () => ({
    ready: Promise.resolve(),
    isGameStateReady: (...args) => isGameStateReadyMock(...args),
}));

vi.mock('../../utils/itemResolver.js', () => ({
    getItemMap: (...args) => getItemMapMock(...args),
    releaseItemImageUrls: (...args) => releaseItemImageUrlsMock(...args),
}));

import CompactItemList from '../svelte/CompactItemList.svelte';

describe('CompactItemList item resolver integration', () => {
    test('renders resolved metadata for custom items', async () => {
        const customId = 'custom-item-compact';
        const metadata = {
            id: customId,
            name: 'foobar',
            description: 'foo bar baz',
            image: 'data:image/png;base64,abc',
        };

        isGameStateReadyMock.mockReturnValue(true);
        getItemCountsMock.mockReturnValue({ [customId]: 1 });
        getItemMapMock.mockResolvedValue(new Map([[customId, metadata]]));

        const { container, getByText } = render(CompactItemList, {
            props: { itemList: [{ id: customId, count: 1 }] },
        });

        await tick();
        await waitFor(() => {
            expect(getByText(/foobar/)).toBeTruthy();
            const icon = container.querySelector('img.icon');
            expect(icon?.getAttribute('src')).toBe(metadata.image);
        });
    });
});
