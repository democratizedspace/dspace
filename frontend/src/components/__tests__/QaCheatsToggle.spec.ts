import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { addItemsMock, getMergedItemCatalogMock } = vi.hoisted(() => ({
    addItemsMock: vi.fn(),
    getMergedItemCatalogMock: vi.fn().mockResolvedValue([
        { id: 'builtin-water', name: 'Water', description: 'Built-in item' },
        { id: 'custom-battery', name: 'Custom Battery', description: 'Custom item' },
    ]),
}));

vi.mock('../../utils/gameState/inventory.js', () => ({
    addItems: (...args: unknown[]) => addItemsMock(...args),
}));

vi.mock('../../utils/itemCatalog.js', () => ({
    getMergedItemCatalog: (...args: unknown[]) => getMergedItemCatalogMock(...args),
}));

vi.mock('../../utils/legacySaveSeeding', () => ({
    clearSeededLegacySaves: vi.fn(),
    getLegacyV1SeedItems: vi.fn().mockReturnValue([]),
    getLegacyV2SeedItems: vi.fn().mockReturnValue([]),
    LEGACY_V1_SEED_PROFILES: [{ id: 'minimal', label: 'Minimal v1' }],
    LEGACY_V2_SEED_PROFILES: [{ id: 'minimal', label: 'Minimal v2' }],
    seedLegacyV1Save: vi.fn(),
    seedLegacyV2LocalStorageSave: vi.fn(),
}));

import QaCheatsToggle from '../svelte/QaCheatsToggle.svelte';

beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('qaCheatsEnabled', 'true');
    addItemsMock.mockReset();
    getMergedItemCatalogMock.mockClear();
});

describe('QaCheatsToggle', () => {
    it('adds selected custom IDs to inventory from the QA cheat panel', async () => {
        const { getByLabelText, getByRole, getByTestId, findByText } = render(QaCheatsToggle, {
            props: { cheatsAvailable: true },
        });

        await waitFor(() => {
            expect(getMergedItemCatalogMock).toHaveBeenCalled();
        });

        const customIdInput = getByLabelText('Custom item ID');
        await fireEvent.input(customIdInput, { target: { value: 'custom-item-qa-1' } });
        await fireEvent.click(getByRole('button', { name: 'Use custom ID' }));

        await fireEvent.input(getByTestId('qa-grant-item-count'), {
            target: { value: '25' },
        });

        await fireEvent.click(getByTestId('qa-grant-item'));

        expect(addItemsMock).toHaveBeenCalledWith([{ id: 'custom-item-qa-1', count: 25 }]);
        expect(await findByText('Added 25 × custom-item-qa-1 to inventory.')).toBeTruthy();
    });
});
