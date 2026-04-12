import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import ProcessView from '../ProcessView.svelte';

const { buyItemsMock, getItemCountMock } = vi.hoisted(() => ({
    buyItemsMock: vi.fn(),
    getItemCountMock: vi.fn(),
}));

vi.mock('../../../../generated/processes.json', () => ({
    default: [
        {
            id: 'detail-process',
            title: 'Detail Process',
            requireItems: [
                { id: 'cheap-item', count: 2 },
                { id: 'expensive-item', count: 2 },
                { id: 'non-buyable-item', count: 1 },
            ],
            consumeItems: [],
            createItems: [],
        },
    ],
}));

vi.mock('../../../inventory/json/items', () => ({
    default: [
        {
            id: 'dusd',
            name: 'dUSD',
            symbol: 'dUSD',
        },
        {
            id: 'cheap-item',
            price: '5 dUSD',
        },
        {
            id: 'expensive-item',
            price: '10 dUSD',
        },
        {
            id: 'non-buyable-item',
            price: '',
        },
    ],
}));

vi.mock('../../../../utils/gameState/inventory.js', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        buyItems: buyItemsMock,
        getItemCount: getItemCountMock,
    };
});

vi.mock('../../../../utils/customcontent.js', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        getProcess: vi.fn().mockResolvedValue(null),
    };
});

describe('ProcessView detail controls', () => {
    let inventory;

    beforeEach(() => {
        buyItemsMock.mockReset();
        getItemCountMock.mockReset();
        inventory = {
            dusd: 0,
            'cheap-item': 0,
            'expensive-item': 0,
            'non-buyable-item': 1,
        };
        getItemCountMock.mockImplementation((id) => inventory[id] ?? 0);
        buyItemsMock.mockImplementation((purchases) => {
            purchases.forEach(({ id, quantity, price, currencyId = 'dusd' }) => {
                inventory[currencyId] -= quantity * price;
                inventory[id] = (inventory[id] ?? 0) + quantity;
            });
        });
    });

    it('always shows Buy required items and explains insufficient currency when disabled', async () => {
        render(ProcessView, { props: { slug: 'detail-process' } });

        const buyButton = await screen.findByRole('button', { name: 'Buy required items' });
        expect(buyButton.getAttribute('disabled')).not.toBeNull();
        expect(
            await screen.findByText('Not enough currency to buy any remaining required items.')
        ).toBeTruthy();
    });

    it('purchases as many missing requirements as possible by increasing price*quantity', async () => {
        inventory.dusd = 25;
        render(ProcessView, { props: { slug: 'detail-process' } });

        const buyButton = await screen.findByRole('button', { name: 'Buy required items' });
        expect(buyButton.getAttribute('disabled')).toBeNull();

        vi.useFakeTimers();
        try {
            await fireEvent.click(buyButton);

            expect(buyItemsMock).toHaveBeenCalledWith([
                { id: 'cheap-item', quantity: 2, price: 5, symbol: 'dUSD', currencyId: 'dusd' },
                {
                    id: 'expensive-item',
                    quantity: 1.5,
                    price: 10,
                    symbol: 'dUSD',
                    currencyId: 'dusd',
                },
            ]);
            expect((await screen.findByRole('status')).textContent).toContain(
                'Added 3.5 items to inventory'
            );

            vi.runAllTimers();
        } finally {
            vi.useRealTimers();
        }
    });

    it('shows disabled reason when all required items are already available', async () => {
        inventory.dusd = 25;
        inventory['cheap-item'] = 2;
        inventory['expensive-item'] = 2;
        render(ProcessView, { props: { slug: 'detail-process' } });

        const buyButton = await screen.findByRole('button', { name: 'Buy required items' });
        expect(buyButton.getAttribute('disabled')).not.toBeNull();
        expect(await screen.findByText('All required items are already available.')).toBeTruthy();
    });
});
