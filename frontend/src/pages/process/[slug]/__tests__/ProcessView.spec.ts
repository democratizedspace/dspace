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
            requireItems: [{ id: 'req-item', count: 2 }],
            consumeItems: [],
            createItems: [],
        },
    ],
}));

vi.mock('../../../inventory/json/items', () => ({
    default: [
        {
            id: 'currency-dusd',
            name: 'dUSD',
        },
        {
            id: 'req-item',
            price: '5 dUSD',
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
        getItemCountMock.mockImplementation((itemId: string) => (itemId === 'currency-dusd' ? 100 : 0));
    });

    it('keeps Buy required items on detail route and purchases missing requirements', async () => {
        render(ProcessView, { props: { slug: 'detail-process' } });

        const buyButton = await screen.findByRole('button', { name: 'Buy required items' });
        expect(buyButton.getAttribute('disabled')).toBeNull();

        vi.useFakeTimers();
        try {
            await fireEvent.click(buyButton);

            expect(buyItemsMock).toHaveBeenCalledWith([
                { id: 'req-item', quantity: 2, price: 5, currencyId: 'currency-dusd' },
            ]);
            expect((await screen.findByRole('status')).textContent).toContain(
                'Added 2 items to inventory'
            );

            vi.runAllTimers();
        } finally {
            vi.useRealTimers();
        }
    });

    it('always renders Buy required items and explains disabled reason when all requirements are available', async () => {
        getItemCountMock.mockImplementation((itemId: string) => (itemId === 'req-item' ? 3 : 0));
        render(ProcessView, { props: { slug: 'detail-process' } });

        const buyButton = await screen.findByRole('button', { name: 'Buy required items' });
        expect(buyButton.getAttribute('disabled')).not.toBeNull();
        expect(buyButton.getAttribute('aria-describedby')).toBe('buy-required-disabled-reason');
        expect(screen.getByText('All required items are already available.')).toBeTruthy();
    });

    it('buys as many items as possible when currency is limited', async () => {
        getItemCountMock.mockImplementation((itemId: string) => {
            if (itemId === 'req-item') {
                return 0;
            }
            if (itemId === 'currency-dusd') {
                return 8;
            }
            return 0;
        });

        render(ProcessView, { props: { slug: 'detail-process' } });
        const buyButton = await screen.findByRole('button', { name: 'Buy required items' });
        expect(buyButton.getAttribute('disabled')).toBeNull();

        await fireEvent.click(buyButton);
        expect(buyItemsMock).toHaveBeenCalledWith([
            { id: 'req-item', quantity: 1, price: 5, currencyId: 'currency-dusd' },
        ]);
    });
});
