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
        {
            id: 'legacy-price-process',
            title: 'Legacy Price Process',
            requireItems: [{ id: 'legacy-price-item', count: 1.5 }],
            consumeItems: [],
            createItems: [],
        },
        {
            id: 'multi-currency-process',
            title: 'Multi Currency Process',
            requireItems: [
                { id: 'req-item-b', count: 1 },
                { id: 'dbi-item-required', count: 2 },
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
            id: 'legacy-price-item',
            price: '15',
        },
        {
            id: 'dbi-item-required',
            price: '4 dBI',
        },
        {
            id: 'dusd-item',
            name: 'dUSD',
        },
        {
            id: 'dbi-item',
            name: 'dBI',
        },
    ],
}));

vi.mock('../../../../pages/inventory/json/items', () => ({
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
            id: 'legacy-price-item',
            price: '15',
        },
        {
            id: 'dbi-item-required',
            price: '4 dBI',
        },
        {
            id: 'dusd-item',
            name: 'dUSD',
        },
        {
            id: 'dbi-item',
            name: 'dBI',
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
        expect(buyButton.hasAttribute('disabled')).toBe(false);

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
        expect(buyButton.hasAttribute('disabled')).toBe(true);
        expect(buyButton.getAttribute('aria-describedby')).toBe(
            'buy-required-disabled-reason-detail-process'
        );
        const reasonElement = document.getElementById(
            'buy-required-disabled-reason-detail-process'
        );
        expect(reasonElement).not.toBeNull();
        expect(reasonElement?.textContent).toBe('All required items are already available.');
        expect(screen.getByText('All required items are already available.')).toBe(reasonElement);
    });

    it('disables with not-enough-currency reason when no required quantity can be purchased', async () => {
        getItemCountMock.mockImplementation((itemId: string) => {
            if (itemId === 'dusd-item') {
                return 0;
            }
            return 0;
        });
        render(ProcessView, { props: { slug: 'detail-process' } });

        const buyButton = await screen.findByRole('button', { name: 'Buy required items' });
        expect(buyButton.hasAttribute('disabled')).toBe(true);
        const reasonElement = document.getElementById(
            'buy-required-disabled-reason-detail-process'
        );
        expect(reasonElement).not.toBeNull();
        expect(reasonElement?.textContent).toBe(
            'Not enough currency to buy any still-needed required items.'
        );
        expect(
            screen.getByText('Not enough currency to buy any still-needed required items.')
        ).toBe(reasonElement);
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
        expect(buyButton.hasAttribute('disabled')).toBe(false);
        await fireEvent.click(buyButton);

        expect(buyItemsMock).toHaveBeenCalledWith([
            { id: 'req-item-b', quantity: 2, price: 2, currencyId: 'dusd-item' },
            { id: 'req-item', quantity: 1, price: 5, currencyId: 'dusd-item' },
        ]);
    });

    it('supports numeric-only legacy prices and preserves fractional quantities', async () => {
        getItemCountMock.mockImplementation((itemId: string) => {
            if (itemId === 'dusd-item') {
                return 22.5;
            }
            return 0;
        });
        render(ProcessView, { props: { slug: 'legacy-price-process' } });

        const buyButton = await screen.findByRole('button', { name: 'Buy required items' });
        expect(buyButton.hasAttribute('disabled')).toBe(false);
        await fireEvent.click(buyButton);

        expect(buyItemsMock).toHaveBeenCalledWith([
            { id: 'legacy-price-item', quantity: 1.5, price: 15, currencyId: 'dusd-item' },
        ]);
    });

    it('builds multi-currency plans using each requirement currency balance independently', async () => {
        getItemCountMock.mockImplementation((itemId: string) => {
            if (itemId === 'dusd-item') {
                return 2;
            }
            if (itemId === 'dbi-item') {
                return 8;
            }
            return 0;
        });
        render(ProcessView, { props: { slug: 'multi-currency-process' } });

        const buyButton = await screen.findByRole('button', { name: 'Buy required items' });
        expect(buyButton.hasAttribute('disabled')).toBe(false);
        await fireEvent.click(buyButton);

        expect(buyItemsMock).toHaveBeenCalledWith([
            { id: 'req-item-b', quantity: 1, price: 2, currencyId: 'dusd-item' },
            { id: 'dbi-item-required', quantity: 2, price: 4, currencyId: 'dbi-item' },
        ]);
    });
});
