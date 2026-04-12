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
        {
            id: 'partial-process',
            title: 'Partial Process',
            requireItems: [
                { id: 'req-item', count: 2 },
                { id: 'other-req-item', count: 2 },
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
            id: 'other-req-item',
            price: '2 dUSD',
        },
        {
            id: 'dUSD',
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
        getItemCountMock.mockImplementation((id: string) => (id === 'dUSD' ? 100 : 0));
    });

    it('keeps Buy required items on detail route and purchases missing requirements', async () => {
        render(ProcessView, { props: { slug: 'detail-process' } });

        const buyButton = await screen.findByRole('button', { name: 'Buy required items' });
        expect(buyButton.getAttribute('disabled')).toBeNull();

        vi.useFakeTimers();
        try {
            await fireEvent.click(buyButton);

            expect(buyItemsMock).toHaveBeenCalledWith([
                { id: 'req-item', quantity: 2, price: 5, currencyId: 'dUSD' },
            ]);
            expect((await screen.findByRole('status')).textContent).toContain(
                'Added 2 items to inventory'
            );

            vi.runAllTimers();
        } finally {
            vi.useRealTimers();
        }
    });

    it('shows disabled reason when all required items are already available', async () => {
        getItemCountMock.mockImplementation((id: string) => {
            if (id === 'req-item') {
                return 2;
            }
            return 0;
        });

        render(ProcessView, { props: { slug: 'detail-process' } });

        const buyButton = await screen.findByRole('button', { name: 'Buy required items' });
        expect(buyButton.getAttribute('disabled')).toBe('');
        expect(buyButton.getAttribute('aria-describedby')).toBe('buy-required-reason');
        expect(screen.getByText('All required items are already available.')).toBeTruthy();
    });

    it('buys as many required items as possible in ascending price*quantity order', async () => {
        getItemCountMock.mockImplementation((id: string) => {
            if (id === 'dUSD') {
                return 9;
            }
            return 0;
        });

        render(ProcessView, { props: { slug: 'partial-process' } });

        const buyButton = await screen.findByRole('button', { name: 'Buy required items' });
        expect(buyButton.getAttribute('disabled')).toBeNull();

        await fireEvent.click(buyButton);

        expect(buyItemsMock).toHaveBeenCalledWith([
            { id: 'other-req-item', quantity: 2, price: 2, currencyId: 'dUSD' },
            { id: 'req-item', quantity: 1, price: 5, currencyId: 'dUSD' },
        ]);
    });
});
