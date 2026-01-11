import 'fake-indexeddb/auto';
import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import LegacySaveUpgrade from '../svelte/LegacySaveUpgrade.svelte';
import {
    closeGameStateDatabaseForTesting,
    loadGameState,
    resetGameState,
} from '../../utils/gameState/common.js';
import items from '../../pages/inventory/json/items';

const EARLY_ADOPTER_ID = items.find((item) => item.name === 'Early Adopter Token')?.id;

describe('LegacySaveUpgrade', () => {
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

    test('detects v1 cookies and merges them into v3 state', async () => {
        expect(EARLY_ADOPTER_ID).toBeTruthy();

        document.cookie = 'item-3=75; path=/';
        document.cookie = 'item-10=2; path=/';
        document.cookie = 'item-21=20%2B; path=/';
        document.cookie = 'item-99=abc; path=/';

        const { findByRole, findByText } = render(LegacySaveUpgrade, {
            legacyV1Items: [],
            legacyCookieKeys: [],
            cheatsAvailable: false,
        });

        await findByText('3 item cookies detected');

        const mergeButton = await findByRole('button', {
            name: /merge v1 into current save/i,
        });
        await fireEvent.click(mergeButton);

        await findByText('Merged v1 items into your current save.');

        await waitFor(() => {
            const state = loadGameState();
            expect(state.inventory['3']).toBe(75);
            expect(state.inventory['10']).toBe(2);
            expect(state.inventory['21']).toBe(20);
            expect(state.inventory[EARLY_ADOPTER_ID]).toBe(1);
        });
    });
});
