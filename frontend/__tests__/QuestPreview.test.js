/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/svelte';
import QuestPreview from '../src/components/svelte/QuestPreview.svelte';

describe('QuestPreview component', () => {
    it('renders quest details', () => {
        const { getByText, getByAltText } = render(QuestPreview, {
            props: {
                title: 'Test Quest',
                description: 'A simple quest',
                imageUrl: '/quest.png',
            },
        });

        getByText('Test Quest');
        getByText('A simple quest');
        const img = getByAltText('Quest preview');
        expect(img.getAttribute('src')).toBe('/quest.png');
    });
});
