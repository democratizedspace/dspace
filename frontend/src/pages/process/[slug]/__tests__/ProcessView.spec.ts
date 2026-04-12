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
                { id: 'req-item', count: 2 },
                { id: 'req-item-b', count: 2 },
            ],
            consumeItems: [],
            createItems: [],
        },
    ],
}));

vi.mock('../../../inventory/json/items', () => ({
    default: [
        {
            id: 'req-item',
            price: '5 dUSD',
        },
        {
            id: 'req-item-b',
            price: '2 dUSD',
        },
        {
            id: 'dusd-item',
            name: 'dUSD',
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
    beforeEach(() => {
        buyItemsMock.mockReset();
        getItemCountMock.mockReset();
        getItemCountMock.mockReturnValue(0);
    });

    it('keeps Buy required items on detail route and purchases missing requirements', async () => {
        getItemCountMock.mockImplementation((itemId: string) => {
            if (itemId === 'dusd-item') {
                return 20;
            }

            return 0;
        });
        render(ProcessView, { props: { slug: 'detail-process' } });

        const buyButton = await screen.findByRole('button', { name: 'Buy required items' });
        expect(buyButton.getAttribute('disabled')).toBeNull();

        vi.useFakeTimers();
        try {
            await fireEvent.click(buyButton);

            expect(buyItemsMock).toHaveBeenCalledWith([
                { id: 'req-item-b', quantity: 2, price: 2, currencyId: 'dusd-item' },
                { id: 'req-item', quantity: 2, price: 5, currencyId: 'dusd-item' },
            ]);
            expect((await screen.findByRole('status')).textContent).toContain(
                'Added 4 items to inventory'
            );

            vi.runAllTimers();
        } finally {
            vi.useRealTimers();
        }
    });

    it('always renders the button and disables it with reason when requirements are already met', async () => {
        getItemCountMock.mockImplementation((itemId: string) => (itemId === 'req-item' ? 2 : 10));
        render(ProcessView, { props: { slug: 'detail-process' } });

        const buyButton = await screen.findByRole('button', { name: 'Buy required items' });
        expect(buyButton.getAttribute('disabled')).not.toBeNull();
        expect(buyButton.getAttribute('aria-describedby')).toBe('buy-required-disabled-reason');
        expect(screen.getAllByText('All required items are already available.')).toHaveLength(2);
    });

    it('disables with not-enough-currency reason when no required quantity can be purchased', async () => {
        getItemCountMock.mockImplementation((itemId: string) => {
            if (itemId === 'dusd-item') {
                return 1;
            }
            return 0;
        });
        render(ProcessView, { props: { slug: 'detail-process' } });

        const buyButton = await screen.findByRole('button', { name: 'Buy required items' });
        expect(buyButton.getAttribute('disabled')).not.toBeNull();
        expect(
            screen.getAllByText('Not enough currency to buy any still-needed required items.')
        ).toHaveLength(2);
    });

    it('buys as many as possible in ascending total-cost order when funds are limited', async () => {
        getItemCountMock.mockImplementation((itemId: string) => {
            if (itemId === 'dusd-item') {
                return 9;
            }
            return 0;
        });
        render(ProcessView, { props: { slug: 'detail-process' } });

        const buyButton = await screen.findByRole('button', { name: 'Buy required items' });
        expect(buyButton.getAttribute('disabled')).toBeNull();
        await fireEvent.click(buyButton);

        expect(buyItemsMock).toHaveBeenCalledWith([
            { id: 'req-item-b', quantity: 2, price: 2, currencyId: 'dusd-item' },
            { id: 'req-item', quantity: 1, price: 5, currencyId: 'dusd-item' },
        ]);
    });
});
