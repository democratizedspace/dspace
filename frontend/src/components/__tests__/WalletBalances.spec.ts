import { render, waitFor } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import { writable } from 'svelte/store';

async function loadCurrencyIds() {
    const { default: allItems } = await vi.importActual<
        typeof import('../../pages/inventory/json/items')
    >('../../pages/inventory/json/items');

    const dUSDId = allItems.find((item) => item.name === 'dUSD')?.id;
    const dBIId = allItems.find((item) => item.name === 'dBI')?.id;

    if (!dUSDId || !dBIId) {
        throw new Error('Currency items are missing from the inventory dataset.');
    }

    return { dUSDId, dBIId };
}

vi.mock('../../pages/inventory/json/items', async () => {
    const { dUSDId, dBIId } = await loadCurrencyIds();
    return {
        default: [
            { id: dUSDId, name: 'dUSD' },
            { id: dBIId, name: 'dBI' },
        ],
    };
});

vi.mock('../../utils/gameState/common.js', async () => {
    const { dUSDId, dBIId } = await loadCurrencyIds();
    const inventoryStore = writable({
        inventory: {
            [dUSDId]: 250,
            [dBIId]: 75,
        },
    });

    return {
        state: inventoryStore,
        ready: Promise.resolve(),
    };
});

import WalletBalances from '../svelte/WalletBalances.svelte';

describe('WalletBalances', () => {
    it('hydrates balances from the game state inventory', async () => {
        const { getByLabelText } = render(WalletBalances, {
            props: {
                currencies: [
                    { symbol: 'dUSD', name: 'dUSD', description: 'Spendable currency.' },
                    { symbol: 'dBI', name: 'dBI', description: 'Basic income token.' },
                    { symbol: 'TEST', name: 'Test', description: 'Fallback currency.' },
                ],
            },
        });

        await waitFor(() => {
            expect(getByLabelText('dUSD balance').textContent).toBe('250 dUSD');
            expect(getByLabelText('dBI balance').textContent).toBe('75 dBI');
        });

        expect(getByLabelText('TEST balance').textContent).toBe('0 TEST');
    });
});
