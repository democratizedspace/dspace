import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import ProcessView from '../src/pages/process/[slug]/ProcessView.svelte';
import { buyItems } from '../src/utils/gameState/inventory.js';

vi.mock('../src/components/svelte/Process.svelte', () => ({
    default: () => null,
}));

vi.mock('../src/generated/processes.json', () => ({
    default: [
        {
            id: 'launch-rocket',
            title: 'Launch Rocket',
            duration: '5m',
            requireItems: [{ id: 'rocket-fuel', count: 2 }],
            consumeItems: [],
            createItems: [],
        },
    ],
}));

vi.mock('../src/pages/inventory/json/items', () => ({
    default: [{ id: 'rocket-fuel', price: '12 dUSD' }],
}));

vi.mock('../src/utils/gameState/inventory.js', () => ({
    buyItems: vi.fn(),
    getItemCount: vi.fn(() => 0),
}));

vi.mock('../src/utils.js', () => ({
    getPriceStringComponents: vi.fn((price: string) => ({ price: Number.parseInt(price, 10) || null })),
}));

vi.mock('../src/utils/customcontent.js', () => ({
    getProcess: vi.fn().mockResolvedValue(null),
}));

describe('ProcessView detail actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('keeps Buy required items action on detail view and buys missing requirements', async () => {
        render(ProcessView, { props: { slug: 'launch-rocket' } });

        const button = await screen.findByRole('button', { name: 'Buy required items' });
        expect(button.hasAttribute('disabled')).toBe(false);

        await fireEvent.click(button);

        expect(buyItems).toHaveBeenCalledWith([{ id: 'rocket-fuel', quantity: 2, price: 12 }]);
        expect(screen.getByRole('status').textContent).toContain('Added 2 items to inventory');
    });
});
