/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/svelte';
import BuySell from '../src/components/svelte/BuySell.svelte';

const mockItems = [
    { id: 'd-usd', name: 'dUSD', price: '1 dUSD', image: '/usd.png' },
    { id: 'd-carbon', name: 'dCarbon', price: '1 dUSD', image: '/carbon.png' },
];

jest.mock('../src/components/svelte/CompactItemList.svelte', () => ({
    __esModule: true,
    default: {},
}));

jest.mock('../../pages/inventory/json/items', () => mockItems, { virtual: true });
jest.mock('../src/pages/inventory/json/items', () => mockItems);

jest.mock('../src/utils/gameState/inventory.js', () => ({
    buyItems: jest.fn(),
    sellItems: jest.fn(),
    getSalesTaxPercentage: jest.fn(() => 0),
}));

describe('BuySell custom item handling', () => {
    it('renders a non-tradeable message for custom items without price metadata', () => {
        const { getByText } = render(BuySell, {
            props: {
                itemId: 'custom-1',
                itemData: {
                    id: 'custom-1',
                    name: 'Custom Widget',
                    price: null,
                    image: '/custom.png',
                },
            },
        });

        expect(getByText('Not tradeable')).toBeTruthy();
    });
});
