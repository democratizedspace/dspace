/** @jest-environment jsdom */
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import '@testing-library/jest-dom';
import { fireEvent, render, waitFor } from '@testing-library/svelte';

import LegacySaveUpgrade from '../src/components/svelte/LegacySaveUpgrade.svelte';
import {
    closeGameStateDatabaseForTesting,
    loadGameState,
    resetGameState,
} from '../src/utils/gameState/common.js';
import items from '../src/pages/inventory/json/items';

const EARLY_ADOPTER_TOKEN_ID = items.find((item) => item.name === 'Early Adopter Token')?.id;

beforeEach(async () => {
    document.cookie = '';
    localStorage.clear();
    await resetGameState();
});

afterEach(async () => {
    await closeGameStateDatabaseForTesting();
    document.cookie = '';
    localStorage.clear();
});

describe('LegacySaveUpgrade v1 merge', () => {
    test('detects v1 cookies and merges into the v3 inventory with trophy', async () => {
        document.cookie = 'item-3=75; path=/';
        document.cookie = 'item-10=2; path=/';

        const { findByText, getByRole } = render(LegacySaveUpgrade, {
            cheatsAvailable: false,
        });

        await findByText(/item cookies detected/i);

        const mergeButton = getByRole('button', { name: 'Merge v1 into current save' });
        expect(mergeButton).toBeEnabled();

        await fireEvent.click(mergeButton);

        await waitFor(() => {
            const state = loadGameState();
            expect(state.inventory['3']).toBe(75);
            expect(state.inventory['10']).toBe(2);
            expect(state.inventory[EARLY_ADOPTER_TOKEN_ID]).toBe(1);
        });
    });
});
