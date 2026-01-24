import 'fake-indexeddb/auto';
import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import LegacySaveUpgrade from '../svelte/LegacySaveUpgrade.svelte';
import {
    closeGameStateDatabaseForTesting,
    loadGameState,
    resetGameState,
} from '../../utils/gameState/common.js';
import { initializeQaCheats, setQaCheatsPreference } from '../../lib/qaCheats';
import items from '../../pages/inventory/json/items';
import legacyV2Fixtures from '../../utils/legacySaveFixtures/legacy_v2_localstorage_save.json';
import {
    V1_CURRENCY_SYMBOL_TO_V3_ITEM_ID,
    V1_ITEM_ID_TO_V3_UUID,
} from '../../utils/legacyV1ItemIdMap.js';
import * as legacySaveSeeding from '../../utils/legacySaveSeeding';

const EARLY_ADOPTER_ID = items.find((item) => item.name === 'Early Adopter Token')?.id;

describe('LegacySaveUpgrade', () => {
    beforeEach(async () => {
        document.cookie = '';
        localStorage.clear();
        document.documentElement.dataset.cheatsAvailable = 'false';
        initializeQaCheats(false);
        setQaCheatsPreference(false);
        await resetGameState();
    });

    afterEach(async () => {
        await closeGameStateDatabaseForTesting();
        document.cookie = '';
        localStorage.clear();
        document.documentElement.dataset.cheatsAvailable = 'false';
        initializeQaCheats(false);
        setQaCheatsPreference(false);
    });

    test('detects v1 cookies and merges them into v3 state', async () => {
        expect(EARLY_ADOPTER_ID).toBeTruthy();

        document.cookie = 'item-3=75; path=/';
        document.cookie = 'item-10=2; path=/';
        document.cookie = 'item-21=20%2B; path=/';
        document.cookie = 'item-99=abc; path=/';
        document.cookie = 'currency-balance-dUSD=12.5; path=/';

        const { findByRole, findByTestId, findByText } = render(LegacySaveUpgrade, {
            legacyV1Items: [],
            legacyCookieKeys: [],
            cheatsAvailable: false,
        });

        const cookieSummary = await findByTestId('legacy-v1-cookie-summary');
        expect(cookieSummary.textContent?.toLowerCase()).toContain('3 item cookies detected');

        const mergeButton = await findByRole('button', {
            name: /merge v1 into current save/i,
        });
        await fireEvent.click(mergeButton);

        await findByText('Merged v1 items into your current save.');

        await waitFor(() => {
            const state = loadGameState();
            expect(state.inventory[V1_ITEM_ID_TO_V3_UUID[3]]).toBe(75);
            expect(state.inventory[V1_ITEM_ID_TO_V3_UUID[10]]).toBe(2);
            expect(state.inventory[V1_ITEM_ID_TO_V3_UUID[21]]).toBe(20);
            expect(state.inventory[V1_CURRENCY_SYMBOL_TO_V3_ITEM_ID.dUSD]).toBe(12.5);
            expect(state.inventory[EARLY_ADOPTER_ID]).toBe(1);
        });
    });

    test('surfaces invalid v1 cookie values with a notice', async () => {
        document.cookie = 'item-99=abc; path=/';

        const { findByText } = render(LegacySaveUpgrade, {
            legacyV1Items: [],
            legacyCookieKeys: [],
            cheatsAvailable: false,
        });

        const notice = await findByText(/V1 cookies were detected/i);
        expect(notice.textContent).toContain('item-99=abc');
    });

    test('shows v2 parse warnings when localStorage contains invalid JSON', async () => {
        localStorage.setItem('gameState', '{bad json');

        const { findByText } = render(LegacySaveUpgrade, {
            legacyV1Items: [],
            legacyCookieKeys: [],
            cheatsAvailable: false,
        });

        await findByText(/Legacy v2 data could not be parsed/i);
    });

    test('shows conflict warning and QA clear button for v2 + v3 saves', async () => {
        const legacyProfile = legacyV2Fixtures.profiles.minimal.gameState;
        localStorage.setItem('gameState', JSON.stringify(legacyProfile));
        document.documentElement.dataset.cheatsAvailable = 'true';
        initializeQaCheats(true);
        setQaCheatsPreference(true);
        const clearSpy = vi
            .spyOn(legacySaveSeeding, 'clearV3GameStateStorage')
            .mockResolvedValue(true);

        const originalLocation = window.location;
        const reloadMock = vi.fn();
        const mockLocation = {
            ...originalLocation,
            reload: reloadMock,
        };
        try {
            Object.defineProperty(window, 'location', {
                configurable: true,
                value: mockLocation,
            });
        } catch {
            delete (window as { location?: Location }).location;
            (window as Window).location = mockLocation;
        }

        vi.useFakeTimers();

        const { findByRole, findByText } = render(LegacySaveUpgrade, {
            legacyV1Items: [],
            legacyCookieKeys: [],
            cheatsAvailable: true,
        });

        await findByText(/Legacy \+ v3 save conflict detected/i);

        const clearButton = await findByRole('button', { name: /clear v3 save for testing/i });
        await fireEvent.click(clearButton);

        await findByText(/Cleared v3 IndexedDB save for QA testing/i);
        expect(clearSpy).toHaveBeenCalled();
        vi.runAllTimers();
        expect(reloadMock).toHaveBeenCalled();

        vi.useRealTimers();
        clearSpy.mockRestore();
        try {
            Object.defineProperty(window, 'location', {
                configurable: true,
                value: originalLocation,
            });
        } catch {
            delete (window as { location?: Location }).location;
            (window as Window).location = originalLocation;
        }
    });

    test('removes legacy v2 data when discarding localStorage saves', async () => {
        const legacyProfile = legacyV2Fixtures.profiles.minimal.gameState;
        localStorage.setItem('gameState', JSON.stringify(legacyProfile));

        const { findByRole, findByText } = render(LegacySaveUpgrade, {
            legacyV1Items: [],
            legacyCookieKeys: [],
            cheatsAvailable: false,
        });

        const discardButton = await findByRole('button', {
            name: /delete v2 localstorage data/i,
        });
        await fireEvent.click(discardButton);

        await findByText(/Removed legacy v2 localStorage data/i);
        expect(localStorage.getItem('gameState')).toBeNull();
    });
});
