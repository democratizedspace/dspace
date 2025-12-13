/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/svelte';
import ProcessPreview from '../src/components/svelte/ProcessPreview.svelte';

describe('ProcessPreview component', () => {
    it('renders process details', () => {
        const { getByText } = render(ProcessPreview, {
            props: {
                title: 'Brew Coffee',
                duration: '5m',
                requireItems: [{ id: 'water', count: 1 }],
                consumeItems: [{ id: 'beans', count: 2 }],
                createItems: [{ id: 'coffee', count: 1 }],
            },
        });

        getByText('Brew Coffee');
        getByText('Duration: 5m');
        getByText('Requires:');
        getByText('water x 1');
        getByText('Consumes:');
        getByText('beans x 2');
        getByText('Creates:');
        getByText('coffee x 1');
    });
});
