import 'fake-indexeddb/auto';
import { fireEvent, render, within } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const { addItemsSpy } = vi.hoisted(() => ({
    addItemsSpy: vi.fn(),
}));

vi.mock('../../utils/gameState/inventory.js', () => ({
    addItems: addItemsSpy,
}));

vi.mock('../../utils/itemCatalog.js', () => ({
    getMergedItemCatalog: vi.fn(async ({ builtInItems = [] } = {}) => builtInItems),
}));

import QaCheatsToggle from '../svelte/QaCheatsToggle.svelte';
import { closeGameStateDatabaseForTesting, resetGameState } from '../../utils/gameState/common.js';
import { initializeQaCheats, setQaCheatsPreference } from '../../lib/qaCheats';

describe('QaCheatsToggle inventory grant', () => {
    beforeEach(async () => {
        localStorage.clear();
        document.documentElement.dataset.cheatsAvailable = 'true';
        initializeQaCheats(true);
        setQaCheatsPreference(false);
        await resetGameState();
        addItemsSpy.mockReset();
    });

    afterEach(async () => {
        await closeGameStateDatabaseForTesting();
        localStorage.clear();
        document.documentElement.dataset.cheatsAvailable = 'false';
        initializeQaCheats(false);
        setQaCheatsPreference(false);
    });

    test('shows inventory grant tool only when staging and cheats are enabled', async () => {
        const { findByTestId } = render(QaCheatsToggle, {
            cheatsAvailable: true,
            stagingEnvironment: true,
        });

        const toggle = await findByTestId('qa-cheats-toggle');
        await fireEvent.click(toggle);

        expect(await findByTestId('qa-inventory-grant-tool')).toBeTruthy();
    });

    test('adds a custom item id to inventory when staging QA cheats are enabled', async () => {
        const { findByTestId, findByRole, findByText } = render(QaCheatsToggle, {
            cheatsAvailable: true,
            stagingEnvironment: true,
        });

        const toggle = await findByTestId('qa-cheats-toggle');
        await fireEvent.click(toggle);

        const itemSelector = await findByTestId('qa-inventory-item-selector');
        const selectorQueries = within(itemSelector);
        const customIdInput = await selectorQueries.findByPlaceholderText('Enter a custom item ID');
        await fireEvent.input(customIdInput, { target: { value: 'qa-custom-dwatt' } });

        const useCustomIdButton = await selectorQueries.findByRole('button', {
            name: 'Use custom item ID',
        });
        await fireEvent.click(useCustomIdButton);

        const countInput = await findByTestId('qa-inventory-item-count');
        await fireEvent.input(countInput, { target: { value: '5000' } });

        const addButton = await findByRole('button', { name: 'Add items to inventory' });
        await fireEvent.click(addButton);

        expect(await findByText('Added 5000 × qa-custom-dwatt to inventory.')).toBeTruthy();
    }, 20000);

    test('hides inventory grant tool outside staging even when QA cheats are enabled', async () => {
        const { findByTestId, queryByTestId } = render(QaCheatsToggle, {
            cheatsAvailable: true,
            stagingEnvironment: false,
        });

        const toggle = await findByTestId('qa-cheats-toggle');
        await fireEvent.click(toggle);

        expect(queryByTestId('qa-inventory-grant-tool')).toBeNull();
    });
});
