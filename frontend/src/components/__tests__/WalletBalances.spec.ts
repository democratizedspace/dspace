import { render, waitFor } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import { writable } from 'svelte/store';
import WalletBalances from '../svelte/WalletBalances.svelte';

const { dUSDId, dBIId } = vi.hoisted(() => ({
    dUSDId: '5247a603-294a-4a34-a884-1ae20969b2a1',
    dBIId: '016d4758-d114-4e04-9e6a-853db93a2eee',
}));

vi.mock('../../utils/gameState/common.js', async () => {
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

describe('WalletBalances', () => {
    it('hydrates balances from the game state inventory', async () => {
        const { getByLabelText } = render(WalletBalances, {
            props: {
                currencies: [
                    { symbol: 'dUSD', name: 'dUSD', description: 'Spendable currency.', balance: 0 },
                    { symbol: 'dBI', name: 'dBI', description: 'Basic income token.', balance: 0 },
                    { symbol: 'TEST', name: 'Test', description: 'Fallback currency.', balance: 7 },
                ],
            },
        });

        await waitFor(() => {
            expect(getByLabelText('dUSD balance').textContent).toBe('250 dUSD');
            expect(getByLabelText('dBI balance').textContent).toBe('75 dBI');
        });

        expect(getByLabelText('TEST balance').textContent).toBe('7 TEST');
    });
});
