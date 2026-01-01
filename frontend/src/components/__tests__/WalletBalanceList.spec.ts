import 'fake-indexeddb/auto';
import { render, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import '@testing-library/jest-dom';
import WalletBalanceList from '../svelte/WalletBalanceList.svelte';
import items from '../../pages/inventory/json/items';
import { loadGameState, resetGameState, saveGameState } from '../../utils/gameState/common.js';
import { prettyPrintNumber } from '../../utils.js';

const dUSDId = items.find((item) => item.name === 'dUSD')?.id;
const dBIId = items.find((item) => item.name === 'dBI')?.id;

if (!dUSDId || !dBIId) {
    throw new Error('Currency item IDs missing for wallet balances');
}

const baseCurrencies = [
    {
        symbol: 'dUSD',
        name: 'dUSD',
        description: 'Spendable currency for items, processes, and conversions.',
        itemId: dUSDId,
        rawBalance: 0,
        balance: prettyPrintNumber(0),
    },
    {
        symbol: 'dBI',
        name: 'dBI',
        description: 'Earned alongside dUSD from the basic income process.',
        itemId: dBIId,
        rawBalance: 0,
        balance: prettyPrintNumber(0),
    },
];

describe('WalletBalanceList', () => {
    beforeEach(async () => {
        await resetGameState();
    });

    it('uses game state balances when cookies are empty', async () => {
        const state = loadGameState();
        state.inventory[dUSDId] = 42;
        state.inventory[dBIId] = 7;
        await saveGameState(state);

        const { getByLabelText } = render(WalletBalanceList, {
            currencies: baseCurrencies,
        });

        await waitFor(() => {
            expect(getByLabelText('dUSD balance')).toHaveTextContent('42 dUSD');
            expect(getByLabelText('dBI balance')).toHaveTextContent('7 dBI');
        });
    });
});
